import asyncHandler from "express-async-handler"
import { Product, Category, Order, OrderItem, ProductColor, ProductImage } from "../models/index.js"
import { Op } from "sequelize"
import sequelize from "../config/db.js"

// @desc    Get personalized product recommendations for a user
// @route   GET /api/recommendations/personalized
// @access  Private
export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  // Get user's purchase history
  const userOrders = await Order.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Product,
            attributes: ["id", "categoryId"],
          },
        ],
      },
    ],
  })

  // Extract product and category IDs from user's purchase history
  const purchasedProductIds = new Set()
  const categoryFrequency = {}

  userOrders.forEach((order) => {
    order.orderItems.forEach((item) => {
      purchasedProductIds.add(item.productId)

      const categoryId = item.Product?.categoryId
      if (categoryId) {
        categoryFrequency[categoryId] = (categoryFrequency[categoryId] || 0) + 1
      }
    })
  })

  // Find the most frequently purchased categories
  const sortedCategories = Object.entries(categoryFrequency)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])

  // Get recommendations based on user's preferred categories
  let recommendations = []

  if (sortedCategories.length > 0) {
    // Get products from user's preferred categories that they haven't purchased yet
    recommendations = await Product.findAll({
      where: {
        id: { [Op.notIn]: Array.from(purchasedProductIds) },
        categoryId: { [Op.in]: sortedCategories.slice(0, 3) }, // Top 3 categories
        isActive: true,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
        {
          model: ProductColor,
          as: "colors",
          include: [
            {
              model: ProductImage,
              as: "images",
              where: { isMain: true },
              required: false,
              limit: 1,
            },
          ],
        },
      ],
      limit: 10,
    })
  }

  // If we don't have enough recommendations, add trending products
  if (recommendations.length < 10) {
    const trendingProducts = await getTrendingProducts(Array.from(purchasedProductIds), 10 - recommendations.length)
    recommendations = [...recommendations, ...trendingProducts]
  }

  res.status(200).json(recommendations)
})

// @desc    Get product recommendations based on a specific product
// @route   GET /api/recommendations/product/:id
// @access  Public
export const getProductBasedRecommendations = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Get the product details
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        attributes: ["id", "name"],
      },
    ],
  })

  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  // Get similar products from the same category
  const similarProducts = await Product.findAll({
    where: {
      id: { [Op.ne]: id }, // Not the same product
      categoryId: product.categoryId,
      isActive: true,
    },
    include: [
      {
        model: Category,
        attributes: ["id", "name"],
      },
      {
        model: ProductColor,
        as: "colors",
        include: [
          {
            model: ProductImage,
            as: "images",
            where: { isMain: true },
            required: false,
            limit: 1,
          },
        ],
      },
    ],
    limit: 4,
  })

  // Get frequently bought together products
  const frequentlyBoughtTogether = await getFrequentlyBoughtTogether(id, 4)

  res.status(200).json({
    similarProducts,
    frequentlyBoughtTogether,
  })
})

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
export const getTrendingProductsEndpoint = asyncHandler(async (req, res) => {
  const limit = Number.parseInt(req.query.limit) || 10
  const trendingProducts = await getTrendingProducts([], limit)

  res.status(200).json(trendingProducts)
})

// Helper function to get trending products
const getTrendingProducts = async (excludeProductIds, limit) => {
  // Get products that have been ordered the most in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const trendingProducts = await OrderItem.findAll({
    attributes: ["productId", [sequelize.fn("COUNT", sequelize.col("OrderItem.id")), "orderCount"]],
    include: [
      {
        model: Order,
        attributes: [],
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      },
      {
        model: Product,
        where: {
          id: { [Op.notIn]: excludeProductIds },
          isActive: true,
        },
        include: [
          {
            model: Category,
            attributes: ["id", "name"],
          },
          {
            model: ProductColor,
            as: "colors",
            include: [
              {
                model: ProductImage,
                as: "images",
                where: { isMain: true },
                required: false,
                limit: 1,
              },
            ],
          },
        ],
      },
    ],
    group: ["productId"],
    order: [[sequelize.literal("orderCount"), "DESC"]],
    limit,
  })

  return trendingProducts.map((item) => item.Product)
}

// Helper function to get frequently bought together products
const getFrequentlyBoughtTogether = async (productId, limit) => {
  // Find orders that contain the specified product
  const ordersWithProduct = await Order.findAll({
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        where: { productId },
      },
    ],
    attributes: ["id"],
  })

  const orderIds = ordersWithProduct.map((order) => order.id)

  if (orderIds.length === 0) {
    return []
  }

  // Find products that were bought in the same orders
  const frequentlyBoughtTogether = await OrderItem.findAll({
    attributes: ["productId", [sequelize.fn("COUNT", sequelize.col("OrderItem.id")), "orderCount"]],
    where: {
      orderId: { [Op.in]: orderIds },
      productId: { [Op.ne]: productId },
    },
    include: [
      {
        model: Product,
        include: [
          {
            model: Category,
            attributes: ["id", "name"],
          },
          {
            model: ProductColor,
            as: "colors",
            include: [
              {
                model: ProductImage,
                as: "images",
                where: { isMain: true },
                required: false,
                limit: 1,
              },
            ],
          },
        ],
      },
    ],
    group: ["productId"],
    order: [[sequelize.literal("orderCount"), "DESC"]],
    limit,
  })

  return frequentlyBoughtTogether.map((item) => item.Product)
}

