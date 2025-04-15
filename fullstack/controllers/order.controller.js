import asyncHandler from "express-async-handler"
import {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Product,
  ProductColor,
  ProductSize,
  ProductImage,
  Address,
  User,
} from "../models/index.js"
import sequelize from "../config/db.js"
import { Op } from "sequelize"

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddressId,
    billingAddressId,
    paymentMethod,
    subtotal,
    tax,
    shipping,
    discount,
    totalPrice,
    notes,
  } = req.body

  if (!orderItems || orderItems.length === 0) {
    res.status(400)
    throw new Error("No order items")
  }

  // Validate shipping address
  const shippingAddress = await Address.findByPk(shippingAddressId)
  if (!shippingAddress) {
    res.status(404)
    throw new Error("Shipping address not found")
  }

  // Validate billing address
  const billingAddress = await Address.findByPk(billingAddressId)
  if (!billingAddress) {
    res.status(404)
    throw new Error("Billing address not found")
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`

  // Create order
  const order = await Order.create({
    userId: req.user.id,
    orderNumber,
    shippingAddressId,
    billingAddressId,
    paymentMethod,
    subtotal,
    tax,
    shipping,
    discount,
    totalPrice,
    notes,
  })

  // Create order items
  const createdOrderItems = await Promise.all(
    orderItems.map(async (item) => {
      const product = await Product.findByPk(item.productId)
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }

      let colorName = null
      if (item.colorId) {
        const color = await ProductColor.findByPk(item.colorId)
        if (color) {
          colorName = color.name
        }
      }

      let sizeName = null
      if (item.sizeId) {
        const size = await ProductSize.findByPk(item.sizeId)
        if (size) {
          sizeName = size.name
        }
      }

      let image = null
      if (item.colorId) {
        const productImage = await ProductImage.findOne({
          where: { colorId: item.colorId, isMain: true },
        })
        if (productImage) {
          image = productImage.url
        }
      }

      return OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        name: product.name,
        colorId: item.colorId || null,
        colorName,
        sizeId: item.sizeId || null,
        sizeName,
        quantity: item.quantity,
        price: item.price,
        image,
      })
    }),
  )

  // Clear cart if order was created from cart
  if (req.body.clearCart) {
    const cart = await Cart.findOne({ where: { userId: req.user.id } })
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } })
      cart.totalItems = 0
      cart.totalPrice = 0
      await cart.save()
    }
  }

  // Get complete order with items
  const completeOrder = await Order.findByPk(order.id, {
    include: [
      {
        model: OrderItem,
        as: "orderItems",
      },
      {
        model: Address,
        as: "shippingAddress",
      },
      {
        model: Address,
        as: "billingAddress",
      },
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "email", "phone"],
      },
    ],
  })

  res.status(201).json(completeOrder)
})

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Product,
            attributes: ["id", "name", "slug"],
          },
        ],
      },
      {
        model: Address,
        as: "shippingAddress",
      },
      {
        model: Address,
        as: "billingAddress",
      },
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "email", "phone"],
      },
    ],
  })

  if (!order) {
    res.status(404)
    throw new Error("Order not found")
  }

  // Check if user is authorized to view this order
  if (order.userId !== req.user.id && req.user.role !== "admin") {
    res.status(403)
    throw new Error("Not authorized to view this order")
  }

  res.status(200).json(order)
})

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const pageSize = 10
  const page = Number(req.query.page) || 1

  const count = await Order.count({
    where: { userId: req.user.id },
  })

  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: OrderItem,
        as: "orderItems",
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset: pageSize * (page - 1),
  })

  res.status(200).json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  })
})

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 20
  const page = Number(req.query.page) || 1

  // Filter options
  const status = req.query.status ? { status: req.query.status } : {}
  const dateFrom = req.query.dateFrom ? { createdAt: { [Op.gte]: new Date(req.query.dateFrom) } } : {}
  const dateTo = req.query.dateTo ? { createdAt: { [Op.lte]: new Date(req.query.dateTo) } } : {}

  const count = await Order.count({
    where: {
      ...status,
      ...dateFrom,
      ...dateTo,
    },
  })

  const orders = await Order.findAll({
    where: {
      ...status,
      ...dateFrom,
      ...dateTo,
    },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset: pageSize * (page - 1),
  })

  res.status(200).json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  })
})

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body

  const order = await Order.findByPk(req.params.id)
  if (!order) {
    res.status(404)
    throw new Error("Order not found")
  }

  // Update status
  order.status = status

  // Update additional fields based on status
  if (status === "shipped") {
    order.isShipped = true
    order.shippedAt = new Date()
  } else if (status === "delivered") {
    order.isDelivered = true
    order.deliveredAt = new Date()
  }

  const updatedOrder = await order.save()
  res.status(200).json(updatedOrder)
})

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const { paymentResult } = req.body

  const order = await Order.findByPk(req.params.id)
  if (!order) {
    res.status(404)
    throw new Error("Order not found")
  }

  // Check if user is authorized
  if (order.userId !== req.user.id && req.user.role !== "admin") {
    res.status(403)
    throw new Error("Not authorized to update this order")
  }

  // Update payment details
  order.isPaid = true
  order.paidAt = new Date()
  order.paymentResultId = paymentResult.id
  order.paymentResultStatus = paymentResult.status
  order.paymentResultUpdateTime = paymentResult.update_time
  order.paymentResultEmail = paymentResult.payer.email_address

  const updatedOrder = await order.save()
  res.status(200).json(updatedOrder)
})

// @desc    Update order tracking
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
export const updateOrderTracking = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.body

  const order = await Order.findByPk(req.params.id)
  if (!order) {
    res.status(404)
    throw new Error("Order not found")
  }

  // Update tracking
  order.trackingNumber = trackingNumber
  order.isShipped = true
  order.shippedAt = new Date()
  order.status = "shipped"

  const updatedOrder = await order.save()
  res.status(200).json(updatedOrder)
})

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res) => {
  // Total orders
  const totalOrders = await Order.count()

  // Total revenue
  const totalRevenue = await Order.sum("totalPrice")

  // Orders by status
  const ordersByStatus = await Order.findAll({
    attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: ["status"],
  })

  // Recent orders
  const recentOrders = await Order.findAll({
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 5,
  })

  // Monthly revenue
  const monthlyRevenue = await Order.findAll({
    attributes: [
      [sequelize.fn("YEAR", sequelize.col("createdAt")), "year"],
      [sequelize.fn("MONTH", sequelize.col("createdAt")), "month"],
      [sequelize.fn("SUM", sequelize.col("totalPrice")), "revenue"],
    ],
    where: {
      createdAt: {
        [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      },
    },
    group: [sequelize.fn("YEAR", sequelize.col("createdAt")), sequelize.fn("MONTH", sequelize.col("createdAt"))],
    order: [
      [sequelize.fn("YEAR", sequelize.col("createdAt")), "ASC"],
      [sequelize.fn("MONTH", sequelize.col("createdAt")), "ASC"],
    ],
  })

  res.status(200).json({
    totalOrders,
    totalRevenue,
    ordersByStatus,
    recentOrders,
    monthlyRevenue,
  })
})

