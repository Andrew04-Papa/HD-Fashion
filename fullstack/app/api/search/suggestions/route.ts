import { NextResponse } from "next/server"
import { searchProducts } from "@/lib/products"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  // Tìm kiếm sản phẩm từ lib/products
  const results = searchProducts(query)

  // Giới hạn kết quả gợi ý
  const suggestions = results.slice(0, 5).map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    images: product.images,
    category: product.category,
  }))

  return NextResponse.json({ suggestions })
}