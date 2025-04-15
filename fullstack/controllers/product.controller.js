import asyncHandler from "express-async-handler"
import { Op } from "sequelize"
import {
  Product,
  Category,
  ProductColor,
  ProductSize,
  ProductImage,
  Review,
  User, // Import User model
} from "../models/index.js"

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12
  const page = Number(req.query.page) || 1

  const keyword = req.query.keyword
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${req.query.keyword}%` } },
          { description: { [Op.like]: `%${req.query.keyword}%` } },
        ],
      }
    : {}

  const category = req.query.category ? { categoryId: req.query.category } : {}
  const featured = req.query.featured ? { isFeatured: true } : {}
  const newProducts = req.query.new ? { isNew: true } : {}
  const bestSeller = req.query.bestseller ? { isBestSeller: true } : {}

  const count = await Product.count({
    where: {
      ...keyword,
      ...category,
      ...featured,
      ...newProducts,
      ...bestSeller,
      isActive: true,
    },
  })

  const products = await Product.findAll({
    where: {
      ...keyword,
      ...category,
      ...featured,
      ...newProducts,
      ...bestSeller,
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
    limit: pageSize,
    offset: pageSize * (page - 1),
    order: [["createdAt", "DESC"]],
  })

  res.status(200).json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  })
})

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
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
            model: ProductSize,
            as: "sizes",
          },
          {
            model: ProductImage,
            as: "images",
          },
        ],
      },
      {
        model: Review,
        as: "reviews",
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "profileImage"],
          },
        ],
      },
    ],
  })

  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  res.status(200).json(product)
})

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { slug: req.params.slug },
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
            model: ProductSize,
            as: "sizes",
          },
          {
            model: ProductImage,
            as: "images",
          },
        ],
      },
      {
        model: Review,
        as: "reviews",
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "profileImage"],
          },
        ],
      },
    ],
  })

  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  res.status(200).json(product)
})

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    compareAtPrice,
    categoryId,
    sku,
    quantity,
    isFeatured,
    isNew,
    isBestSeller,
    metaTitle,
    metaDescription,
  } = req.body

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")

  // Check if slug already exists
  const slugExists = await Product.findOne({ where: { slug } })
  if (slugExists) {
    res.status(400)
    throw new Error("Product with this name already exists")
  }

  // Create product
  const product = await Product.create({
    name,
    slug,
    description,
    price,
    compareAtPrice,
    categoryId,
    sku,
    quantity,
    isFeatured,
    isNew,
    isBestSeller,
    metaTitle,
    metaDescription,
  })

  if (product) {
    res.status(201).json(product)
  } else {
    res.status(400)
    throw new Error("Invalid product data")
  }
})

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id)

  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  // Generate new slug if name is updated
  let slug = product.slug
  if (req.body.name && req.body.name !== product.name) {
    slug = req.body.name
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-")

    // Check if new slug already exists
    const slugExists = await Product.findOne({
      where: {
        slug,
        id: { [Op.ne]: req.params.id },
      },
    })

    if (slugExists) {
      res.status(400)
      throw new Error("Product with this name already exists")
    }
  }

  // Update product
  product.name = req.body.name || product.name
  product.slug = slug
  product.description = req.body.description || product.description
  product.price = req.body.price || product.price
  product.compareAtPrice = req.body.compareAtPrice || product.compareAtPrice
  product.categoryId = req.body.categoryId || product.categoryId
  product.sku = req.body.sku || product.sku
  product.quantity = req.body.quantity !== undefined ? req.body.quantity : product.quantity
  product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive
  product.isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : product.isFeatured
  product.isNew = req.body.isNew !== undefined ? req.body.isNew : product.isNew
  product.isBestSeller = req.body.isBestSeller !== undefined ? req.body.isBestSeller : product.isBestSeller
  product.metaTitle = req.body.metaTitle || product.metaTitle
  product.metaDescription = req.body.metaDescription || product.metaDescription

  const updatedProduct = await product.save()
  res.status(200).json(updatedProduct)
})

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id)

  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  await product.destroy()
  res.status(200).json({ message: "Product removed" })
})

// @desc    Add product color
// @route   POST /api/products/:id/colors
// @access  Private/Admin
export const addProductColor = asyncHandler(async (req, res) => {
  const { name, colorCode } = req.body

  const product = await Product.findByPk(req.params.id)
  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  const color = await ProductColor.create({
    productId: product.id,
    name,
    colorCode,
  })

  res.status(201).json(color)
})

// @desc    Add product size
// @route   POST /api/products/colors/:colorId/sizes
// @access  Private/Admin
export const addProductSize = asyncHandler(async (req, res) => {
  const { name, quantity } = req.body

  const color = await ProductColor.findByPk(req.params.colorId)
  if (!color) {
    res.status(404)
    throw new Error("Color not found")
  }

  const size = await ProductSize.create({
    colorId: color.id,
    name,
    quantity,
  })

  res.status(201).json(size)
})

// @desc    Upload product images
// @route   POST /api/products/colors/:colorId/images
// @access  Private/Admin
export const uploadProductImages = asyncHandler(async (req, res) => {
  const color = await ProductColor.findByPk(req.params.colorId)
  if (!color) {
    res.status(404)
    throw new Error("Color not found")
  }

  if (!req.files || req.files.length === 0) {
    res.status(400)
    throw new Error("Please upload at least one image")
  }

  const images = []
  for (let i = 0; i < req.files.length; i++) {
    const image = await ProductImage.create({
      colorId: color.id,
      url: `/uploads/${req.files[i].filename}`,
      isMain: i === 0, // First image is main
      sortOrder: i,
    })
    images.push(image)
  }

  res.status(201).json(images)
})

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body

  const product = await Product.findByPk(req.params.id)
  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  // Check if user already reviewed this product
  const alreadyReviewed = await Review.findOne({
    where: {
      userId: req.user.id,
      productId: product.id,
    },
  })

  if (alreadyReviewed) {
    res.status(400)
    throw new Error("Product already reviewed")
  }

  // Create review
  const review = await Review.create({
    userId: req.user.id,
    productId: product.id,
    rating: Number(rating),
    title,
    comment,
  })

  // Update product rating
  const reviews = await Review.findAll({
    where: { productId: product.id },
  })

  product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
  product.reviewCount = reviews.length

  await product.save()

  res.status(201).json({ message: "Review added" })
})

