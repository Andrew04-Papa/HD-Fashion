export type Product = {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  subcategory?: string
  sizes?: string[]
  colors?: string[]
  tags?: string[]
  featured?: boolean
  bestseller?: boolean
  new?: boolean
  sale?: boolean
}

export const products: Product[] = [
  {
    id: "1",
    name: "Classic White T-Shirt",
    description:
      "A timeless white t-shirt made from 100% organic cotton. Perfect for everyday wear and easy to style with any outfit.",
    price: 29.99,
    images: ["/Classic White T-Shirt.png?height=600&width=400", "/Classic White T-Shirt Black.jpg?height=600&width=400"],
    category: "men",
    subcategory: "t-shirts",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White", "Black"],
    tags: ["cotton", "basic", "casual"],
    featured: true,
    bestseller: true,
  },
  {
    id: "2",
    name: "Straight Leg Jeans",
    description:
      "Modern slim fit jeans with a comfortable stretch. These versatile jeans can be dressed up or down for any occasion.",
    price: 59.99,
    images: ["/Straight Leg Jeans.jpg?height=600&width=400", "/Straight Leg Jeans Black.jpg?height=600&width=400"],
    category: "men",
    subcategory: "jeans",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Blue", "Black"],
    tags: ["denim", "slim fit", "casual"],
    bestseller: true,
  },
  {
    id: "3",
    name: "Floral Summer Dress",
    description:
      "A beautiful floral dress perfect for summer days. Made from lightweight fabric with a flattering silhouette.",
    price: 49.99,
    images: ["/Floral Summer Dress.jpg?height=600&width=400", "/Floral Summer Dress White.jpg?height=600&width=400"],
    category: "women",
    subcategory: "dresses",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Pink", "White"],
    tags: ["summer", "floral", "casual"],
    featured: true,
  },
  {
    id: "4",
    name: "Leather Crossbody Bag",
    description:
      "A stylish leather crossbody bag with multiple compartments. Perfect for keeping your essentials organized on the go.",
    price: 79.99,
    images: ["/Leather Crossbody Bag.jpg?height=600&width=400", "/Leather Crossbody Bag Black.jpg?height=600&width=400"],
    category: "accessories",
    subcategory: "bags",
    colors: ["Brown", "Black"],
    tags: ["leather", "crossbody", "bag"],
    bestseller: true,
  },
  {
    id: "5",
    name: "Oversized Knit Sweater",
    description: "A cozy oversized knit sweater perfect for colder days. Features a relaxed fit and soft, warm fabric.",
    price: 69.99,
    originalPrice: 89.99,
    images: ["/Oversized Knit Sweater.jpg?height=600&width=400", "/Oversized Knit Sweater Gray.png?height=600&width=400"],
    category: "women",
    subcategory: "sweaters",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Cream", "Gray"],
    tags: ["knit", "oversized", "winter"],
    sale: true,
  },
  {
    id: "6",
    name: "Tailored Blazer",
    description:
      "A sophisticated tailored blazer that adds polish to any outfit. Perfect for work or special occasions.",
    price: 129.99,
    images: ["/Tailored Blazer.jpg?height=600&width=400", "/Tailored Blazer Beige.jpg?height=600&width=400"],
    category: "women",
    subcategory: "jackets",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Beige"],
    tags: ["formal", "blazer", "work"],
    new: true,
  },
  {
    id: "7",
    name: "Athletic Performance Shorts",
    description: "Lightweight athletic shorts designed for maximum performance and comfort during workouts.",
    price: 34.99,
    images: ["/Athletic Performance Shorts.jpg?height=600&width=400", "/Athletic Performance Shorts Gray.jpg?height=600&width=400"],
    category: "men",
    subcategory: "shorts",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Gray"],
    tags: ["athletic", "performance", "workout"],
    new: true,
  },
  {
    id: "8",
    name: "Minimalist Watch",
    description: "A sleek minimalist watch with a leather strap. Adds a touch of sophistication to any outfit.",
    price: 99.99,
    originalPrice: 129.99,
    images: ["/Minimalist Watch.jpg?height=600&width=400", "/Minimalist Watch Silver.avif?height=600&width=400"],
    category: "accessories",
    subcategory: "watches",
    colors: ["Black/Blue", "Silver/Black"],
    tags: ["watch", "minimalist", "accessory"],
    sale: true,
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((product) => product.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured)
}

export function getBestsellerProducts(): Product[] {
  return products.filter((product) => product.bestseller)
}

export function getNewProducts(): Product[] {
  return products.filter((product) => product.new)
}

export function getSaleProducts(): Product[] {
  return products.filter((product) => product.sale)
}

//  Improved search function - replaces old function
export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase()

  // Create search keyword array
  const searchTerms = lowercaseQuery.split(/\s+/).filter((term) => term.length > 0)

  if (searchTerms.length === 0) return []

  // Calculate the appropriate score for each product
  const scoredProducts = products.map((product) => {
    let score = 0

    // Search in product name (highest weight)
    const productName = product.name.toLowerCase()
    searchTerms.forEach((term) => {
      if (productName.includes(term)) {
        score += 10
        // If the name starts with a keyword, increase the score
        if (productName.startsWith(term)) score += 5
      }
    })

    // Search in description
    const description = product.description.toLowerCase()
    searchTerms.forEach((term) => {
      if (description.includes(term)) score += 3
    })

    // Search in tags
    if (product.tags) {
      product.tags.forEach((tag) => {
        const lowercaseTag = tag.toLowerCase()
        searchTerms.forEach((term) => {
          if (lowercaseTag.includes(term)) score += 5
          if (lowercaseTag === term) score += 3
        })
      })
    }

    // Search in category and subcategory
    const category = product.category.toLowerCase()
    const subcategory = product.subcategory?.toLowerCase() || ""

    searchTerms.forEach((term) => {
      if (category.includes(term)) score += 4
      if (subcategory.includes(term)) score += 4
    })

    return { product, score }
  })

  // Filter products with score > 0 and sort by score descending
  return scoredProducts
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product)
}