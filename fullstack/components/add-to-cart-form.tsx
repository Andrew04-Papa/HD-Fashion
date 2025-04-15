"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/components/cart-provider"
import type { Product } from "@/lib/products"

interface AddToCartFormProps {
  product: Product
}

export default function AddToCartForm({ product }: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined,
  )
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined,
  )
  const { addItem } = useCart()

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity,
      size: selectedSize,
      color: selectedColor,
    })
  }

  return (
    <div className="space-y-4">
      {/* Size Selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <label htmlFor="size-select" className="block text-sm font-medium mb-2">
            Size
          </label>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger id="size-select" className="w-full">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {product.sizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Color Selector */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <label htmlFor="color-select" className="block text-sm font-medium mb-2">
            Color
          </label>
          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger id="color-select" className="w-full">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {product.colors.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium mb-2">
          Quantity
        </label>
        <div className="flex items-center">
          <Button type="button" variant="outline" size="icon" onClick={decreaseQuantity} disabled={quantity <= 1}>
            <Minus className="h-4 w-4" />
            <span className="sr-only">Decrease quantity</span>
          </Button>
          <span className="w-12 text-center">{quantity}</span>
          <Button type="button" variant="outline" size="icon" onClick={increaseQuantity}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button onClick={handleAddToCart} className="w-full gap-2 mt-4">
        <ShoppingCart className="h-4 w-4" />
        Add to Cart
      </Button>
    </div>
  )
}

