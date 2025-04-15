// Helper function to check if a product matches a search query
export function productMatchesQuery(product: any, query: string): boolean {
  if (!query) return true

  const searchTerms = query
    .toLowerCase()
    .split(" ")
    .filter((term) => term.length > 0)

  if (searchTerms.length === 0) return true

  const productName = product.name?.toLowerCase() || ""
  const productDescription = product.description?.toLowerCase() || ""
  const productCategory = product.category?.toLowerCase() || ""

  return searchTerms.every(
    (term) => productName.includes(term) || productDescription.includes(term) || productCategory.includes(term),
  )
}

// Helper function to implement search if searchProducts is not working
export function fallbackSearchProducts(products: any[], query: string) {
  if (!query || !products || !Array.isArray(products)) return []

  return products.filter((product) => productMatchesQuery(product, query))
}
