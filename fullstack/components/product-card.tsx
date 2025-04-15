"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/components/cart-provider"
import type { Product } from "@/lib/products"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
    })
  }

  return (
    <Card className="overflow-hidden group">
      <Link href={`/product/${product.id}`} className="relative block">
        <div className="aspect-square overflow-hidden">
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            width={400}
            height={400}
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {product.new && <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>}
          {product.sale && <Badge className="bg-red-500 hover:bg-red-600">Sale</Badge>}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/product/${product.id}`} className="hover:underline">
              <h3 className="font-medium">{product.name}</h3>
            </Link>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Add to wishlist</span>
          </Button>
        </div>
        <div className="mt-2 flex items-center">
          <span className="font-medium">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="ml-2 text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}

