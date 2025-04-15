"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, ShoppingCart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/cart-provider"
import { useWishlist } from "@/components/wishlist-provider"

export default function WishlistPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const { addItem } = useCart()
  const { items: wishlistItems, removeItem } = useWishlist()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshUser()
    // Simulate loading wishlist
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [refreshUser])

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    })
  }

  if (isLoading || loading) {
    return (
      <div className="container flex items-center justify-center py-16 md:py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading wishlist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">Manage your account information and wishlist</p>
        </div>

        <Separator />

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64 space-y-4">
            <nav className="flex flex-col space-y-1">
              <Link
                href="/account"
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
              >
                My Profile
              </Link>
              <Link
                href="/orders"
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
              >
                My Orders
              </Link>
              <Link
                href="/wishlist"
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground"
              >
                My Wishlist
              </Link>
            </nav>
          </div>

          <div className="flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Wishlist</h2>
              </div>

              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wishlistItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <Image
                          src={item.image || "/placeholder.svg?height=300&width=300"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 rounded-full"
                          onClick={() => removeItem(item.id)}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                          <span className="sr-only">Remove from wishlist</span>
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <Link href={`/product/${item.id}`} className="hover:underline">
                          <h3 className="font-medium">{item.name}</h3>
                        </Link>
                        <div className="mt-2 flex items-center">
                          <span className="font-medium">${item.price.toFixed(2)}</span>
                          {item.originalPrice && (
                            <span className="ml-2 text-sm text-muted-foreground line-through">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Button onClick={() => handleAddToCart(item)} className="w-full mt-4 gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                    <p className="text-muted-foreground mb-6">Save items you like to your wishlist</p>
                    <Button asChild>
                      <Link href="/products">Explore products</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
