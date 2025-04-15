import asyncHandler from "express-async-handler"
import { Category, Product, ProductColor, ProductImage } from "../models/index.js"
import { Op } from "sequelize"

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { isActive: true },
    include: [
      {
        model: Category,
        as: "subcategories",
        where: { isActive: true },
        required: false,
      },
    ],
    order: [["name", "ASC"]],
  })

  res.status(200).json(categories)
})

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id, {
    include: [
      {
        model: Category,
        as: "subcategories",
        where: { isActive: true },
        required: false,
      },
    ],
  })

  if (!category) {
    res.status(404)
    throw new Error("Category not found")
  }

  res.status(200).json(category)
})

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    where: { slug: req.params.slug },
    include: [
      {
        model: Category,
        as: "subcategories",
        where: { isActive: true },
        required: false,
      },
    ],
  })

  if (!category) {
    res.status(404)
    throw new Error("Category not found")
  }

  // Get products in this category
  const products = await Product.findAll({
    where: {
      categoryId: category.id,
      isActive: true,
    },
    include: [
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
  })

  res.status(200).json({
    category,
    products,
  })
})

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentId, metaTitle, metaDescription } = req.body

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")

  // Check if slug already exists
  const slugExists = await Category.findOne({ where: { slug } })
  if (slugExists) {
    res.status(400)
    throw new Error("Category with this name already exists")
  }

  // Create category
  const category = await Category.create({
    name,
    slug,
    description,
    parentId,
    metaTitle,
    metaDescription,
  })

  if (category) {
    res.status(201).json(category)
  } else {
    res.status(400)
    throw new Error("Invalid category data")
  }
})

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id)

  if (!category) {
    res.status(404)
    throw new Error("Category not found")
  }

  // Generate new slug if name is updated
  let slug = category.slug
  if (req.body.name && req.body.name !== category.name) {
    slug = req.body.name
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-")

    // Check if new slug already exists
    const slugExists = await Category.findOne({
      where: {
        slug,
        id: { [Op.ne]: req.params.id },
      },
    })

    if (slugExists) {
      res.status(400)
      throw new Error("Category with this name already exists")
    }
  }

  // Update category
  category.name = req.body.name || category.name
  category.slug = slug
  category.description = req.body.description || category.description
  category.parentId = req.body.parentId || category.parentId
  category.isActive = req.body.isActive !== undefined ? req.body.isActive : category.isActive
  category.metaTitle = req.body.metaTitle || category.metaTitle
  category.metaDescription = req.body.metaDescription || category.metaDescription

  const updatedCategory = await category.save()
  res.status(200).json(updatedCategory)
})

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id)

  if (!category) {
    res.status(404)
    throw new Error("Category not found")
  }

  // Check if category has products
  const products = await Product.findOne({
    where: { categoryId: category.id },
  })

  if (products) {
    res.status(400)
    throw new Error("Cannot delete category with products")
  }

  // Check if category has subcategories
  const subcategories = await Category.findOne({
    where: { parentId: category.id },
  })

  if (subcategories) {
    res.status(400)
    throw new Error("Cannot delete category with subcategories")
  }

  await category.destroy()
  res.status(200).json({ message: "Category removed" })
})

// @desc    Upload category image
// @route   POST /api/categories/:id/image
// @access  Private/Admin
export const uploadCategoryImage = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id)

  if (!category) {
    res.status(404)
    throw new Error("Category not found")
  }

  if (!req.file) {
    res.status(400)
    throw new Error("Please upload a file")
  }

  // Update category image
  category.image = `/uploads/${req.file.filename}`
  await category.save()

  res.status(200).json({
    message: "Category image uploaded successfully",
    image: category.image,
  })
})

