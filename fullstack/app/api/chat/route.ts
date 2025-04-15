import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"
import { products } from "@/lib/products"

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Create a product catalog string for context
  const productCatalog = products
    .map((product) => {
      return `
      Product ID: ${product.id}
      Name: ${product.name}
      Category: ${product.category}${product.subcategory ? `, Subcategory: ${product.subcategory}` : ""}
      Price: $${product.price.toFixed(2)}${product.originalPrice ? ` (Original: $${product.originalPrice.toFixed(2)})` : ""}
      Description: ${product.description}
      Available Sizes: ${product.sizes?.join(", ") || "N/A"}
      Available Colors: ${product.colors?.join(", ") || "N/A"}
      Tags: ${product.tags?.join(", ") || "N/A"}
      ${product.new ? "New Arrival" : ""}${product.sale ? "On Sale" : ""}${product.bestseller ? "Bestseller" : ""}
    `
    })
    .join("\n")

  const systemPrompt = `
    You are an AI shopping assistant for a fashion e-commerce store. Your goal is to help customers find products they're looking for and provide information about the store's offerings.
    
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
  `

  const result = streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    messages,
    system: systemPrompt,
  })

  return result.toDataStreamResponse()
}

