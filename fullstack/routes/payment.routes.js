import express from "express"
import {
  createPaymentIntent,
  processPayPalPayment,
  processCashOnDelivery,
  stripeWebhook,
} from "../controllers/payment.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/create-payment-intent", protect, createPaymentIntent)
router.post("/paypal", protect, processPayPalPayment)
router.post("/cod", protect, processCashOnDelivery)

// Stripe webhook doesn't need authentication
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook)

export default router

