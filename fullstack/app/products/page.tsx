"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { products } from "@/lib/products"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ChatbotButton from "@/components/chatbot-button"
import { Search } from "lucide-react"

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL parameters
  const initialSearch = searchParams.get("q") || ""
  const initialCategory = searchParams.get("category") || ""
  const initialMinPrice = searchParams.get("minPrice") || ""
  const initialMaxPrice = searchParams.get("maxPrice") || ""
  const initialSort = searchParams.get("sort") || "featured"

  // State for filters
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [minPrice, setMinPrice] = useState(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
  const [sortBy, setSortBy] = useState(initialSort)
  const [filteredProducts, setFilteredProducts] = useState(products)

  // Apply filters and update URL
  const applyFilters = () => {
    // Build query parameters
    const params = new URLSearchParams()

    if (searchQuery) params.set("q", searchQuery)
    if (selectedCategory) params.set("category", selectedCategory)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (sortBy !== "featured") params.set("sort", sortBy)

    // Update URL with filters
    router.push(`/products?${params.toString()}`)

    // Filter products
    let filtered = [...products]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          (product.tags && product.tags.some((tag) => tag.toLowerCase().includes(query))),
      )
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Filter by price range
    if (minPrice) {
      filtered = filtered.filter((product) => product.price >= Number.parseFloat(minPrice))
    }

    if (maxPrice) {
      filtered = filtered.filter((product) => product.price <= Number.parseFloat(maxPrice))
    }

    // Sort products
    switch (sortBy) {
      case "price-low-high":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high-low":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "newest":
        filtered.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0))
        break
      default:
        // Default sorting (featured)
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        break
    }

    setFilteredProducts(filtered)
  }

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  // Apply filters on initial load and when URL parameters change
  useEffect(() => {
    applyFilters()
  }, [searchParams])

  // Reset category filter
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === "all" ? "" : category)
    setTimeout(() => applyFilters(), 0)
  }

  return (
    <main className="flex-1">
      <div className="container px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-6">All Products</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Search</h3>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-10">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </form>
            </div>

            <div>
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="space-y-2">
                <Button
                  variant={!selectedCategory ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick("all")}
                >
                  All Products
                </Button>
                <Button
                  variant={selectedCategory === "men" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick("men")}
                >
                  Men
                </Button>
                <Button
                  variant={selectedCategory === "women" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick("women")}
                >
                  Women
                </Button>
                <Button
                  variant={selectedCategory === "accessories" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick("accessories")}
                >
                  Accessories
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Sort By</h3>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value)
                  setTimeout(() => applyFilters(), 0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-medium mb-3">Price Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
              <Button className="w-full mt-2" onClick={applyFilters}>
                Apply
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium mb-2">No products found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters to find what you're looking for.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("")
                    setMinPrice("")
                    setMaxPrice("")
                    setSortBy("featured")
                    router.push("/products")
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatbotButton />
    </main>
  )
}
