"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingBag, Package } from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

// Mock order data
const mockOrders = [
  {
    id: "ORD-12345",
    date: "2023-10-15",
    status: "Delivered",
    total: 129.99,
    items: [
      { id: "1", name: "Classic White T-Shirt", quantity: 2, price: 29.99 },
      { id: "4", name: "Leather Crossbody Bag", quantity: 1, price: 79.99 },
    ],
  },
  {
    id: "ORD-12346",
    date: "2023-11-02",
    status: "Processing",
    total: 59.99,
    items: [{ id: "2", name: "Slim Fit Jeans", quantity: 1, price: 59.99 }],
  },
]

export default function OrdersPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const [orders, setOrders] = useState(mockOrders)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshUser()
    // Simulate loading orders
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [refreshUser])

  if (isLoading || loading) {
    return (
      <div className="container flex items-center justify-center py-16 md:py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading order history...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container flex items-center justify-center py-16 md:py-24">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Not logged in</CardTitle>
            <CardDescription>Please log in to view your orders</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Create new account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">Manage your account information and orders</p>
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
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground"
              >
                My Orders
              </Link>
              <Link
                href="/wishlist"
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
              >
                My Wishlist
              </Link>
            </nav>
          </div>

          <div className="flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Orders</h2>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                            <CardDescription>Placed on {new Date(order.date).toLocaleDateString()}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {order.status}
                            </span>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {item.quantity} x {item.name}
                                </span>
                              </div>
                              <span>${item.price.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t flex justify-between font-medium">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-6">You haven't placed any orders yet</p>
                    <Button asChild>
                      <Link href="/products">Start shopping</Link>
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
