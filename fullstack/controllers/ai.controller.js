import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"
import asyncHandler from "express-async-handler"
import { Product, Category, ProductColor, ProductSize, ProductImage, User, UserMeasurement } from "../models/index.js"
import { Op } from "sequelize"

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Public
export const chatWithAI = asyncHandler(async (req, res) => {
  const { messages, userId } = req.body

  // Get product catalog for context
  const products = await Product.findAll({
    where: { isActive: true },
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
            attributes: ["name", "quantity"],
          },
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
    limit: 100,
  })

  // Create a product catalog string for context
  const productCatalog = products
    .map((product) => {
      const colors = product.colors.map((color) => color.name).join(", ")
      const sizes = product.colors
        .flatMap((color) => color.sizes.map((size) => size.name))
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ")
      const imageUrl = product.colors[0]?.images[0]?.url || "No image available"

      return `
      Product ID: ${product.id}
      Name: ${product.name}
      Category: ${product.Category.name}
      Price: $${product.price.toFixed(2)}${product.compareAtPrice ? ` (Original: $${product.compareAtPrice.toFixed(2)})` : ""}
      Description: ${product.description}
      Available Colors: ${colors}
      Available Sizes: ${sizes}
      Image: ${imageUrl}
      ${product.isNew ? "New Arrival" : ""}${product.isBestSeller ? "Bestseller" : ""}
    `
    })
    .join("\n")

  // Get user information if available
  let userContext = ""
  if (userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserMeasurement,
            as: "measurements",
          },
        ],
      })

      if (user) {
        userContext = `
          User Information:
          Name: ${user.firstName} ${user.lastName}
          Gender: ${user.gender || "Not specified"}
          ${
            user.measurements
              ? `
          Measurements:
          Height: ${user.measurements.height || "Not provided"} cm
          Weight: ${user.measurements.weight || "Not provided"} kg
          Bust: ${user.measurements.bust || "Not provided"} cm
          Waist: ${user.measurements.waist || "Not provided"} cm
          Hips: ${user.measurements.hips || "Not provided"} cm
          `
              : "No measurements provided"
          }
        `
      }
    } catch (error) {
      console.error("Error fetching user data for AI context:", error)
    }
  }

  // Create system prompt with product catalog and user context
  const systemPrompt = `
    You are an AI shopping assistant for HD Fashion, a fashion e-commerce store. Your goal is to help customers find products they're looking for and provide information about the store's offerings.
    
    ${userContext ? "Here is information about the user you are helping:\n" + userContext : ""}
    
    Here's the current product catalog:
    ${productCatalog}
    
    Guidelines:
    - Be friendly, helpful, and concise.
    - Recommend products based on customer preferences.
    - If asked about a product not in the catalog, suggest similar alternatives.
    - Provide specific details about products when asked.
    - Help with sizing recommendations when appropriate.
    - Assist with general shopping questions.
    - Don't make up information about products not in the catalog.
    - If you don't know something, be honest and offer to help in another way.
    
    Style Advice Guidelines:
    - When giving style advice, consider the user's body type, preferences, and the occasion.
    - Suggest complete outfits by combining items from the catalog.
    - Explain why certain styles would be flattering for the user.
    - Consider seasonal trends and classic style principles.
    - If the user hasn't provided measurements or preferences, ask for more information.
    
    Size Recommendation Guidelines:
    - Use the user's measurements to recommend the right size.
    - If measurements are not available, ask for height, weight, and usual size.
    - Explain how the fit of specific products might differ (e.g., runs small, loose fit).
    - Consider the material and stretch of the garment when making recommendations.
    
    Shopping Assistance Guidelines:
    - Help users navigate the shopping process.
    - Explain shipping policies, return policies, and payment options.
    - Assist with order tracking and customer service inquiries.
    - Guide users through the checkout process if needed.
  `

  // Stream the AI response
  const result = streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    messages,
    system: systemPrompt,
  })

  return result.toDataStreamResponse()
})

// @desc    Get style advice
// @route   POST /api/ai/style-advice
// @access  Public
export const getStyleAdvice = asyncHandler(async (req, res) => {
  const { occasion, preferences, bodyType, gender, age, budget, season } = req.body

  // Get relevant products based on preferences and occasion
  const whereClause = { isActive: true }

  if (gender) {
    const category = gender.toLowerCase() === "female" ? "women" : "men"
    const categoryRecord = await Category.findOne({
      where: { name: { [Op.like]: `%${category}%` } },
    })

    if (categoryRecord) {
      whereClause.categoryId = categoryRecord.id
    }
  }

  // Get products
  const products = await Product.findAll({
    where: whereClause,
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
    limit: 20,
  })

  // Create a product catalog string for context
  const productCatalog = products
    .map((product) => {
      const colors = product.colors.map((color) => color.name).join(", ")
      const imageUrl = product.colors[0]?.images[0]?.url || "No image available"

      return `
      Product ID: ${product.id}
      Name: ${product.name}
      Category: ${product.Category.name}
      Price: $${product.price.toFixed(2)}
      Description: ${product.description}
      Available Colors: ${colors}
      Image: ${imageUrl}
    `
    })
    .join("\n")

  // Create the prompt for style advice
  const prompt = `
    I need style advice for the following:
    Occasion: ${occasion || "Not specified"}
    Preferences: ${preferences || "Not specified"}
    Body Type: ${bodyType || "Not specified"}
    Gender: ${gender || "Not specified"}
    Age: ${age || "Not specified"}
    Budget: ${budget || "Not specified"}
    Season: ${season || "Not specified"}
  `

  // Create system prompt with product catalog
  const systemPrompt = `
    You are a professional fashion stylist for HD Fashion. Your goal is to provide personalized style advice based on the customer's needs and preferences.
    
    Here's the current product catalog you can recommend from:
    ${productCatalog}
    
    Guidelines:
    - Provide a complete outfit recommendation with specific products from the catalog.
    - Explain why each piece works for the customer's body type and occasion.
    - Consider the customer's budget and preferences.
    - Suggest 2-3 alternative options for key pieces.
    - Include styling tips for accessories and how to wear the outfit.
    - Format your response in a clear, organized way with sections for each part of the outfit.
    - Include product IDs when recommending specific items.
  `

  // Generate the style advice
  const { text } = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    prompt,
    system: systemPrompt,
  })

  res.status(200).json({ styleAdvice: await text })
})

// @desc    Get size recommendation
// @route   POST /api/ai/size-recommendation
// @access  Public
export const getSizeRecommendation = asyncHandler(async (req, res) => {
  const { productId, height, weight, bust, waist, hips, gender, usualSize } = req.body

  // Get product details
  const product = await Product.findByPk(productId, {
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
            model: ProductSize,
            as: "sizes",
          },
        ],
      },
    ],
  })

  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  // Get available sizes for the product
  const availableSizes = product.colors
    .flatMap((color) => color.sizes.map((size) => size.name))
    .filter((v, i, a) => a.indexOf(v) === i)

  // Create the prompt for size recommendation
  const prompt = `
    I need a size recommendation for the following product:
    Product: ${product.name}
    Category: ${product.Category.name}
    
    My measurements are:
    Height: ${height || "Not provided"} cm
    Weight: ${weight || "Not provided"} kg
    Bust: ${bust || "Not provided"} cm
    Waist: ${waist || "Not provided"} cm
    Hips: ${hips || "Not provided"} cm
    Gender: ${gender || "Not provided"}
    Usual Size: ${usualSize || "Not provided"}
    
    Available sizes for this product are: ${availableSizes.join(", ")}
  `

  // Create system prompt
  const systemPrompt = `
    You are a sizing expert for HD Fashion. Your goal is to recommend the best size for customers based on their measurements and the specific product they're interested in.
    
    Guidelines:
    - Analyze the customer's measurements and the product category to determine the best size.
    - Consider how different brands and styles might fit differently.
    - Explain your reasoning for the size recommendation.
    - If the measurements are incomplete, explain what additional information would be helpful.
    - If you're uncertain between two sizes, explain the trade-offs of each.
    - Only recommend sizes that are available for the product.
    - Format your response clearly with a definitive size recommendation at the beginning.
  `

  // Generate the size recommendation
  const { text } = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    prompt,
    system: systemPrompt,
  })

  res.status(200).json({ sizeRecommendation: await text })
})

