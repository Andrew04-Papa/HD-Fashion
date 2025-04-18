"use client"

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import ProductCard from "@/components/product-card";
import { Loader2 } from "lucide-react";
import type { Product } from "@/lib/products";
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "relevance";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  // State for filter values
  const [filterCategory, setFilterCategory] = useState<string[]>(category ? category.split(",") : []);
  const [filterMinPrice, setFilterMinPrice] = useState(minPrice);
  const [filterMaxPrice, setFilterMaxPrice] = useState(maxPrice);
  const [filterSort, setFilterSort] = useState(sort);

  // Categories for filter
  const categories = [
    { value: "all", label: "All Products" },
    { value: "men", label: "Men" },
    { value: "women", label: "Women" },
    { value: "accessories", label: "Accessories" },
  ];

  // Search Query State
  const [queryState, setQueryState] = useState(query);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryState(e.target.value);
  };

  // Fetch search results based on query and filters
  useEffect(() => {
    async function fetchSearchResults() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (queryState) params.append("q", queryState);
        if (filterCategory.length > 0) params.append("category", filterCategory.join(","));
        if (filterMinPrice) params.append("minPrice", filterMinPrice);
        if (filterMaxPrice) params.append("maxPrice", filterMaxPrice);
        if (filterSort) params.append("sort", filterSort);

        const response = await fetch(`/api/search?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products);
          setTotalResults(data.total);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [queryState, filterCategory, filterMinPrice, filterMaxPrice, filterSort]);

  // Apply filters and update URL
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (queryState) params.append("q", queryState);
    if (filterCategory.length > 0) params.append("category", filterCategory.join(","));
    if (filterMinPrice) params.append("minPrice", filterMinPrice);
    if (filterMaxPrice) params.append("maxPrice", filterMaxPrice);
    if (filterSort) params.append("sort", filterSort);

    router.push(`/search?${params.toString()}`);
  };

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
            `Found ${totalResults} results for "${queryState}"`
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Side - Search and Filters */}
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                value={queryState}
                onChange={handleSearchChange}
                placeholder="Search for products..."
                className="p-2 border border-gray-300 rounded-lg flex-1"
              />
            </div>

            {/* Categories Filter with Checkboxes */}
            <div>
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${cat.value}`}
                      checked={filterCategory.includes(cat.value)}
                      onCheckedChange={(checked) => {
                        const updatedCategory = checked
                          ? [...filterCategory, cat.value]
                          : filterCategory.filter((value) => value !== cat.value);
                        setFilterCategory(updatedCategory);
                      }}
                    />
                    <label htmlFor={`category-${cat.value}`} className="text-sm font-medium leading-none">
                      {cat.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sort By */}
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

            {/* Price Range */}
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

          {/* Right Side - Products */}
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
  );
}