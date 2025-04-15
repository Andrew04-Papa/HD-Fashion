"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Package, Users, ShoppingBag, DollarSign } from "lucide-react"
import Link from "next/link"

type DashboardStats = {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In practice, you will call the API to get the statistics.
        // Here we will simulate the data.
        setStats({
          totalUsers: 120,
          totalProducts: 45,
          totalOrders: 230,
          totalRevenue: 15750000,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    if (user && user.isAdmin) {
      fetchStats()
    }
  }, [user])

  if (isLoading || isLoadingStats) {
    return (
      <div className="container flex items-center justify-center py-16 md:py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="container flex items-center justify-center py-16 md:py-24">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Access denied</CardTitle>
            <CardDescription>You do not have access to the admin page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Back to home page</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin page</h1>
          <p className="text-muted-foreground">Manage products, orders and users</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">+12 new users this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total product</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">+5 new products this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total order</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">+18 orders this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "USD" }).format(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">+2.5% month-on-month</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Product</TabsTrigger>
            <TabsTrigger value="orders">Order</TabsTrigger>
            <TabsTrigger value="users">User</TabsTrigger>
            <TabsTrigger value="settings">Setting</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Add, edit and delete products in the store</CardDescription>
                  </div>
                  <Button>Add new product</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Product management functionality is under development.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/admin/products">View all products</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order Management</CardTitle>
                    <CardDescription>View and update order status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Order management functionality is under development</p>
                  <Button className="mt-4" asChild>
                    <Link href="/admin/orders">View all orders</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage user accounts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">User management functionality is under development</p>
                  <Button className="mt-4" asChild>
                    <Link href="/admin/users">View all users</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Manage store and system settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Settings function is under development</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

