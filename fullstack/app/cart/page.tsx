"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { Separator } from "@/components/ui/separator"
import ChatbotButton from "@/components/chatbot-button"

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart()

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    updateQuantity(id, newQuantity)
  }

  return (
    <main className="flex-1">
      <div className="container px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="rounded-lg border">
                <div className="p-6 space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0">
                        <div className="relative h-24 w-24 rounded-md overflow-hidden">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.size && item.color && <span> / </span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                          <div className="mt-1">${item.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">Decrease quantity</span>
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                              <span className="sr-only">Increase quantity</span>
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-lg border p-6 space-y-6">
                <h2 className="text-xl font-medium">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full gap-2">
                  Checkout <ArrowRight className="h-4 w-4" />
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <p>Secure checkout powered by Stripe</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button asChild variant="link">
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ChatbotButton />
    </main>
  )
}

