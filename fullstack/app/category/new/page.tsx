import { getNewProducts } from "@/lib/products"
import ProductCard from "@/components/product-card"
import ChatbotButton from "@/components/chatbot-button"

export default function NewArrivalsPage() {
  const products = getNewProducts()

  return (
    <main className="flex-1">
      <div className="container px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-6">New Arrivals</h1>
        <p className="text-muted-foreground mb-8">
          Discover our latest additions to the collection. Be the first to shop our newest styles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium mb-4">No new products available</h2>
            <p className="text-muted-foreground">Check back soon for our latest arrivals.</p>
          </div>
        )}
      </div>
      <ChatbotButton />
    </main>
  )
}

