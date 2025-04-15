import { notFound } from "next/navigation"
import { getProductsByCategory } from "@/lib/products"
import ProductCard from "@/components/product-card"
import ChatbotButton from "@/components/chatbot-button"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

// Remove the async and await keywords because getProductsByCategory is a synchronous function
export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params

  // No need to await because this is a synchronous function
  const products = getProductsByCategory(slug)

  if (products.length === 0) {
    notFound() // If no product, return error 404
  }

  const categoryNames: Record<string, string> = {
    men: "Men's Fashion",
    women: "Women's Fashion",
    accessories: "Accessories",
  }

  const categoryName = categoryNames[slug] || slug

  return (
    <main className="flex-1">
      <div className="container px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
      <ChatbotButton />
    </main>
  )
}

