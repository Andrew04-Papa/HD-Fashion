"use client"

import type React from "react"
import { createContext, useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export type WishlistItem = {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
}

type WishlistContextType = {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
  clearWishlist: () => void
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const { toast } = useToast()

  // Load wishlist from localStorage on client side
  useEffect(() => {
    const storedWishlist = localStorage.getItem("wishlist")
    if (storedWishlist) {
      try {
        setItems(JSON.parse(storedWishlist))
      } catch (error) {
        console.error("Failed to parse wishlist from localStorage", error)
      }
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(items))
  }, [items])

  const addItem = (item: WishlistItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) return prevItems

      toast({
        title: "Added to wishlist",
        description: `${item.name} has been added to your wishlist`,
      })

      return [...prevItems, item]
    })
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === id)
      if (item) {
        toast({
          title: "Removed from wishlist",
          description: `${item.name} has been removed from your wishlist`,
        })
      }
      return prevItems.filter((item) => item.id !== id)
    })
  }

  const isInWishlist = (id: string) => {
    return items.some((item) => item.id === id)
  }

  const clearWishlist = () => {
    setItems([])
    toast({
      title: "Wishlist cleared",
      description: "All items have been removed from your wishlist",
    })
  }

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}
