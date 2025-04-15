import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getFeaturedProducts, getBestsellerProducts, getNewProducts } from "@/lib/products"
import ProductCard from "@/components/product-card"
import ChatbotButton from "@/components/chatbot-button"

export default function Home() {
  const featuredProducts = getFeaturedProducts()
  const bestsellerProducts = getBestsellerProducts().slice(0, 4)
  const newProducts = getNewProducts().slice(0, 4)

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative h-full w-full bg-gray-900">
          <Image
            src="/fashion man and women.jpg?height=1080&width=1920"
            alt="Fashion collection"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 z-20 flex items-center justify-center text-center">
          <div className="container px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Discover Your Style
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-white/90">
              Explore our latest collection and find the perfect outfit for any occasion.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="/products">Shop Now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg bg-transparent text-white border-white hover:bg-white hover:text-black"
              >
                <Link href="/category/new">New Arrivals</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="overflow-hidden">
              <div className="relative h-[300px]">
                <Image
                  src="/man.jpg?height=600&width=400"
                  alt="Men's Fashion"
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/category/men">Men</Link>
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="relative h-[300px]">
                <Image
                  src="/women.jpg?height=600&width=400"
                  alt="Women's Fashion"
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/category/women">Women</Link>
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="relative h-[300px]">
                <Image
                  src="/Accessories.jpg?height=600&width=400"
                  alt="Accessories"
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/category/accessories">Accessories</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Bestsellers</h2>
            <Button asChild variant="ghost" className="gap-1">
              <Link href="/products">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {bestsellerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">New Arrivals</h2>
            <Button asChild variant="ghost" className="gap-1">
              <Link href="/category/new">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="rounded-lg bg-primary/10 p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Join Our Newsletter</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>

      {/* Chatbot Button */}
      <ChatbotButton />
    </main>
  )
}

