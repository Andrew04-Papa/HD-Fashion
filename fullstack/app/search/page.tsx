"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import ProductCard from "@/components/product-card"
import { Loader2 } from "lucide-react"
import type { Product } from "@/lib/products"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""
  const sort = searchParams.get("sort") || "relevance"

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalResults, setTotalResults] = useState(0)

  // State for filter values
  const [filterCategory, setFilterCategory] = useState(category)
  const [filterMinPrice, setFilterMinPrice] = useState(minPrice)
  const [filterMaxPrice, setFilterMaxPrice] = useState(maxPrice)
  const [filterSort, setFilterSort] = useState(sort)

  // Categories for filter
  const categories = [
    { value: "men", label: "Men" },
    { value: "women", label: "Women" },
    { value: "accessories", label: "Accessories" },
  ]

  useEffect(() => {
    async function fetchSearchResults() {
      setLoading(true)
      try {
        // Build query string
        const params = new URLSearchParams()
        if (query) params.append("q", query)
        if (category) params.append("category", category)
        if (minPrice) params.append("minPrice", minPrice)
        if (maxPrice) params.append("maxPrice", maxPrice)
        if (sort) params.append("sort", sort)

        const response = await fetch(`/api/search?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products)
          setTotalResults(data.total)
        }
      } catch (error) {
        console.error("Error fetching search results:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query, category, minPrice, maxPrice, sort])

  // Apply filters
  const applyFilters = () => {
    // Build URL with filters
    const params = new URLSearchParams()
    if (query) params.append("q", query)
    if (filterCategory) params.append("category", filterCategory)
    if (filterMinPrice) params.append("minPrice", filterMinPrice)
    if (filterMaxPrice) params.append("maxPrice", filterMaxPrice)
    if (filterSort) params.append("sort", filterSort)

    // Update URL with new filters
    router.push(`/search?${params.toString()}`)
  }

  return (
    <main className="flex-1">
      <div className="container px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground mb-6">
          {loading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </span>
          ) : (
            `Found ${totalResults} results for "${query}"`
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${cat.value}`}
                      checked={filterCategory === cat.value}
                      onCheckedChange={() => setFilterCategory(filterCategory === cat.value ? "" : cat.value)}
                    />
                    <label
                      htmlFor={`category-${cat.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {cat.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Sort By</h3>
              <Select value={filterSort} onValueChange={setFilterSort}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Price Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                />
              </div>
              <Button className="w-full mt-4" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-medium mb-4">No products found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <Button asChild>
                  <Link href="/products">Browse All Products</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
