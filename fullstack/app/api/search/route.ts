import { NextResponse } from "next/server"
import { searchProducts } from "@/lib/products"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const category = searchParams.get("category")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const sort = searchParams.get("sort") || "relevance"

  if (!query) {
    return NextResponse.json({ products: [] })
  }

  // Search for products from lib/products
  let results = searchProducts(query)

  // Filter by category if available
  if (category) {
    results = results.filter((product) => product.category === category)
  }

  // Filter by price if available
  if (minPrice) {
    results = results.filter((product) => product.price >= Number(minPrice))
  }

  if (maxPrice) {
    results = results.filter((product) => product.price <= Number(maxPrice))
  }

  // Sort results
  switch (sort) {
    case "price-low-high":
      results.sort((a, b) => a.price - b.price)
      break
    case "price-high-low":
      results.sort((a, b) => b.price - a.price)
      break
    case "newest":
      // Suppose the newest products are those with the attribute new
      results.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0))
      break
    default:
      // Default sort by relevance (no change in order)
      break
  }

  return NextResponse.json({
    products: results,
    total: results.length,
    query,
  })
}