import asyncHandler from "express-async-handler"
import { Order } from "../models/index.js"
import dotenv from "dotenv"
import Stripe from "stripe"

dotenv.config()

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// @desc    Create payment intent with Stripe
// @route   POST /api/payment/create-payment-intent
// @access  Private
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  // Get order details
  const order = await Order.findByPk(orderId)

  if (!order) {
    res.status(404)
    throw new Error("Order not found")
  }

  if (order.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to access this order")
  }

  if (order.isPaid) {
    res.status(400)
    throw new Error("Order is already paid")
  }

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100), // Stripe expects amount in cents
    currency: "usd",
    metadata: {
      orderId: order.id,
      userId: req.user.id,
    },
  })

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
  })
})

// @desc    Process PayPal payment
// @route   POST /api/payment/paypal
// @access  Private
export const processPayPalPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentResult } = req.body

  // Get order details
  const order = await Order.findByPk(orderId)

  if (!order) {
    res.status(404)
    throw new Error("Order not found")
  }

  if (order.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to access this order")
  }

  if (order.isPaid) {
    res.status(400)
    throw new Error("Order is already paid")
  }

  // Update order with payment details
  order.isPaid = true
  order.paidAt = Date.now()
  order.paymentResultId = paymentResult.id
  order.paymentResultStatus = paymentResult.status
  order.paymentResultUpdateTime = paymentResult.update_time
  order.paymentResultEmail = paymentResult.payer.email_address

  const updatedOrder = await order.save()

  res.status(200).json(updatedOrder)
})

// @desc    Process Cash on Delivery
// @route   POST /api/payment/cod
// @access  Private
export const processCashOnDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  // Get order details
  const order = await Order.findByPk(orderId)

  if (!order) {
    res.status(404)
    throw new Error("Order not found")
  }

  if (order.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to access this order")
  }

  // Update order with COD payment method
  order.paymentMethod = "Cash on Delivery"
  order.status = "processing"

  const updatedOrder = await order.save()

  res.status(200).json(updatedOrder)
})

// @desc    Webhook for Stripe events
// @route   POST /api/payment/webhook
// @access  Public
export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"]

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      await handleSuccessfulPayment(paymentIntent)
      break
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object
      await handleFailedPayment(failedPayment)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true })
})

// Helper function to handle successful payment
const handleSuccessfulPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata

  if (!orderId) {
    console.error("No orderId found in payment metadata")
    return
  }

  const order = await Order.findByPk(orderId)

  if (!order) {
    console.error(`Order ${orderId} not found`)
    return
  }

  // Update order with payment details
  order.isPaid = true
  order.paidAt = new Date()
  order.paymentResultId = paymentIntent.id
  order.paymentResultStatus = paymentIntent.status
  order.status = "processing"

  await order.save()

  console.log(`Payment for order ${orderId} processed successfully`)
}

// Helper function to handle failed payment
const handleFailedPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata

  if (!orderId) {
    console.error("No orderId found in payment metadata")
    return
  }

  const order = await Order.findByPk(orderId)

  if (!order) {
    console.error(`Order ${orderId} not found`)
    return
  }

  // Update order with failed payment status
  order.paymentResultId = paymentIntent.id
  order.paymentResultStatus = "failed"

  await order.save()

  console.log(`Payment for order ${orderId} failed`)
}

