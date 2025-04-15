import dotenv from "dotenv"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"
import { User, Category, Product, ProductColor, ProductSize, ProductImage } from "../models/index.js"
import { connectDB } from "../config/db.js"

dotenv.config()

// Connect to database
connectDB()

// Sample data
const users = [
  {
    id: uuidv4(),
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
    isVerified: true,
  },
  {
    id: uuidv4(),
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "password123",
    role: "customer",
    isVerified: true,
  },
]

const categories = [
  {
    id: uuidv4(),
    name: "Men",
    slug: "men",
    description: "Men's fashion",
  },
  {
    id: uuidv4(),
    name: "Women",
    slug: "women",
    description: "Women's fashion",
  },
  {
    id: uuidv4(),
    name: "Accessories",
    slug: "accessories",
    description: "Fashion accessories",
  },
]

const products = [
  {
    id: uuidv4(),
    name: "Classic White T-Shirt",
    slug: "classic-white-t-shirt",
    description:
      "A timeless white t-shirt made from 100% organic cotton. Perfect for everyday wear and easy to style with any outfit.",
    price: 29.99,
    categoryId: null, // Will be set to Men's category
    sku: "TS-001",
    quantity: 100,
    isFeatured: true,
    isNew: true,
    isBestSeller: true,
  },
  {
    id: uuidv4(),
    name: "Slim Fit Jeans",
    slug: "slim-fit-jeans",
    description:
      "Modern slim fit jeans with a comfortable stretch. These versatile jeans can be dressed up or down for any occasion.",
    price: 59.99,
    categoryId: null, // Will be set to Men's category
    sku: "JN-001",
    quantity: 50,
    isFeatured: false,
    isNew: false,
    isBestSeller: true,
  },
  {
    id: uuidv4(),
    name: "Floral Summer Dress",
    slug: "floral-summer-dress",
    description:
      "A beautiful floral dress perfect for summer days. Made from lightweight fabric with a flattering silhouette.",
    price: 49.99,
    categoryId: null, // Will be set to Women's category
    sku: "DR-001",
    quantity: 30,
    isFeatured: true,
    isNew: true,
    isBestSeller: false,
  },
  {
    id: uuidv4(),
    name: "Leather Crossbody Bag",
    slug: "leather-crossbody-bag",
    description:
      "A stylish leather crossbody bag with multiple compartments. Perfect for keeping your essentials organized on the go.",
    price: 79.99,
    categoryId: null, // Will be set to Accessories category
    sku: "BG-001",
    quantity: 20,
    isFeatured: false,
    isNew: false,
    isBestSeller: true,
  },
]

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await User.destroy({ where: {} })
    await Category.destroy({ where: {} })
    await Product.destroy({ where: {} })
    await ProductColor.destroy({ where: {} })
    await ProductSize.destroy({ where: {} })
    await ProductImage.destroy({ where: {} })

    // Create users
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
        return User.create(user)
      }),
    )

    console.log(`${createdUsers.length} users imported`)

    // Create categories
    const createdCategories = await Category.bulkCreate(categories)
    console.log(`${createdCategories.length} categories imported`)

    // Set category IDs for products
    const menCategory = createdCategories.find((c) => c.slug === "men")
    const womenCategory = createdCategories.find((c) => c.slug === "women")
    const accessoriesCategory = createdCategories.find((c) => c.slug === "accessories")

    products[0].categoryId = menCategory.id
    products[1].categoryId = menCategory.id
    products[2].categoryId = womenCategory.id
    products[3].categoryId = accessoriesCategory.id

    // Create products
    const createdProducts = await Product.bulkCreate(products)
    console.log(`${createdProducts.length} products imported`)

    // Create product colors, sizes, and images
    for (const product of createdProducts) {
      // Create colors
      const colors = ["White", "Black", "Blue"]
      for (const colorName of colors) {
        const color = await ProductColor.create({
          productId: product.id,
          name: colorName,
          colorCode: colorName === "White" ? "#FFFFFF" : colorName === "Black" ? "#000000" : "#0000FF",
        })

        // Create sizes
        const sizes = ["S", "M", "L", "XL"]
        for (const sizeName of sizes) {
          await ProductSize.create({
            colorId: color.id,
            name: sizeName,
            quantity: Math.floor(Math.random() * 20) + 5,
          })
        }

        // Create images
        await ProductImage.create({
          colorId: color.id,
          url: `/placeholder.svg?height=600&width=400`,
          isMain: true,
          sortOrder: 0,
        })

        await ProductImage.create({
          colorId: color.id,
          url: `/placeholder.svg?height=600&width=400`,
          isMain: false,
          sortOrder: 1,
        })
      }
    }

    console.log("Sample data imported successfully")
    process.exit()
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

importData()

