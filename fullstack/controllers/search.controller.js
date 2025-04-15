import asyncHandler from "express-async-handler"
import { Product, Category, ProductColor, ProductImage, ProductSize } from "../models/index.js"
import { Op } from "sequelize"
import sequelize from "../config/db.js"

// @desc    Search products by keyword
// @route   GET /api/search
// @access  Public
export const searchProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, colors, sizes, sort, page = 1, limit = 12 } = req.query

  // Build where clause
  const whereClause = { isActive: true }

  // Keyword search
  if (keyword) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { description: { [Op.like]: `%${keyword}%` } },
      { metaTitle: { [Op.like]: `%${keyword}%` } },
      { metaDescription: { [Op.like]: `%${keyword}%` } },
    ]
  }

  // Category filter
  if (category) {
    whereClause.categoryId = category
  }

  // Price range filter
  if (minPrice || maxPrice) {
    whereClause.price = {}
    if (minPrice) whereClause.price[Op.gte] = Number.parseFloat(minPrice)
    if (maxPrice) whereClause.price[Op.lte] = Number.parseFloat(maxPrice)
  }

  // Include options
  const includeOptions = [
    {
      model: Category,
      attributes: ["id", "name", "slug"],
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
  ]

  // Color filter
  if (colors) {
    const colorArray = colors.split(",")
    includeOptions[1].where = {
      name: { [Op.in]: colorArray },
    }
  }

  // Size filter
  if (sizes) {
    const sizeArray = sizes.split(",")
    includeOptions[1].include.push({
      model: ProductSize,
      as: "sizes",
      where: {
        name: { [Op.in]: sizeArray },
        quantity: { [Op.gt]: 0 },
      },
    })
  }

  // Determine sort order
  let order = [["createdAt", "DESC"]]
  if (sort) {
    switch (sort) {
      case "price-asc":
        order = [["price", "ASC"]]
        break
      case "price-desc":
        order = [["price", "DESC"]]
        break
      case "name-asc":
        order = [["name", "ASC"]]
        break
      case "name-desc":
        order = [["name", "DESC"]]
        break
      case "newest":
        order = [["createdAt", "DESC"]]
        break
      case "rating":
        order = [["rating", "DESC"]]
        break
      default:
        order = [["createdAt", "DESC"]]
    }
  }

  // Calculate pagination
  const offset = (page - 1) * limit

  // Execute search query
  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    include: includeOptions,
    order,
    limit: Number.parseInt(limit),
    offset: Number.parseInt(offset),
    distinct: true,
  })

  // Get facets for filtering
  const facets = await getSearchFacets(keyword)

  res.status(200).json({
    products,
    page: Number.parseInt(page),
    pages: Math.ceil(count / limit),
    count,
    facets,
  })
})

// @desc    Visual search - find similar products by image
// @route   POST /api/search/visual
// @access  Public
export const visualSearch = asyncHandler(async (req, res) => {
  // In a real implementation, this would use image recognition APIs
  // For now, we'll simulate by returning products from a similar category

  const { categoryId } = req.body

  if (!categoryId) {
    res.status(400)
    throw new Error("Category ID is required for visual search simulation")
  }

  // Get products from the same category
  const products = await Product.findAll({
    where: {
      categoryId,
      isActive: true,
    },
    include: [
      {
        model: Category,
        attributes: ["id", "name", "slug"],
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

  res.status(200).json({
    message: "Visual search results (simulated)",
    products,
  })
})

// Helper function to get facets for filtering
const getSearchFacets = async (keyword) => {
  // Build where clause for facets
  const whereClause = { isActive: true }

  if (keyword) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { description: { [Op.like]: `%${keyword}%` } },
      { metaTitle: { [Op.like]: `%${keyword}%` } },
      { metaDescription: { [Op.like]: `%${keyword}%` } },
    ]
  }

  // Get category facets
  const categoryFacets = await Product.findAll({
    attributes: ["categoryId", [sequelize.fn("COUNT", sequelize.col("Product.id")), "count"]],
    where: whereClause,
    include: [
      {
        model: Category,
        attributes: ["name", "slug"],
      },
    ],
    group: ["categoryId", "Category.id"],
    order: [[sequelize.literal("count"), "DESC"]],
  })

  // Get price range
  const priceRange = await Product.findAll({
    attributes: [
      [sequelize.fn("MIN", sequelize.col("price")), "minPrice"],
      [sequelize.fn("MAX", sequelize.col("price")), "maxPrice"],
    ],
    where: whereClause,
  })

  // Get color facets
  const colorFacets = await ProductColor.findAll({
    attributes: ["name", [sequelize.fn("COUNT", sequelize.col("ProductColor.id")), "count"]],
    include: [
      {
        model: Product,
        where: whereClause,
        attributes: [],
      },
    ],
    group: ["ProductColor.name"],
    order: [[sequelize.literal("count"), "DESC"]],
  })

  // Get size facets
  const sizeFacets = await ProductSize.findAll({
    attributes: ["name", [sequelize.fn("COUNT", sequelize.col("ProductSize.id")), "count"]],
    include: [
      {
        model: ProductColor,
        as: "color",
        attributes: [],
        include: [
          {
            model: Product,
            where: whereClause,
            attributes: [],
          },
        ],
      },
    ],
    group: ["ProductSize.name"],
    order: [[sequelize.literal("count"), "DESC"]],
  })

  return {
    categories: categoryFacets,
    priceRange: priceRange[0],
    colors: colorFacets,
    sizes: sizeFacets,
  }
}

