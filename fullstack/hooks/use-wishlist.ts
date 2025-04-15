"use client"

import { useContext } from "react"
import { WishlistContext } from "@/components/providers/wishlist-provider"

export const useWishlist = () => {
  const context = useContext(WishlistContext)

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }

  return context
}
