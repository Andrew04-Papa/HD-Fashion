"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect, memo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, ShoppingCart, User, Search, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/components/cart-provider"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const routes = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All Products" },
  { href: "/category/men", label: "Men" },
  { href: "/category/women", label: "Women" },
  { href: "/category/accessories", label: "Accessories" },
  { href: "/category/new", label: "New Arrivals" },
  { href: "/sale", label: "Sale" },
]

// Memoize navigation links to prevent unnecessary re-renders
const NavLink = memo(({ href, label, pathname }: { href: string; label: string; pathname: string }) => (
  <Link
    href={href}
    className={cn("transition-colors hover:text-primary", pathname === href ? "text-primary" : "text-foreground")}
    prefetch={true}
  >
    {label}
  </Link>
))

NavLink.displayName = "NavLink"

function Header() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { items } = useCart()
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const itemCount = items.length

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    await logout()
  }

  // Don't render anything on server side to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-lg font-medium transition-colors hover:text-primary",
                    pathname === route.href ? "text-primary" : "text-muted-foreground",
                  )}
                  prefetch={true}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2" prefetch={true}>
            <span className="font-bold text-xl">FASHION STORE</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <NavLink key={route.href} href={route.href} label={route.label} pathname={pathname} />
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Search */}
          <Button variant="ghost" size="icon" onClick={() => router.push("/search")}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* User Account */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild className="py-3">
                  <Link href="/account" prefetch={true}>
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-3">
                  <Link href="/orders" prefetch={true}>
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-3">
                  <Link href="/wishlist" prefetch={true}>
                    My Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="py-3">
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login" prefetch={true}>
                <User className="h-5 w-5" />
                <span className="sr-only">Login</span>
              </Link>
            </Button>
          )}

          {/* Wishlist */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/wishlist" prefetch={true}>
              <Heart className="h-5 w-5" />
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart" prefetch={true}>
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

// Export as memoized component to prevent unnecessary re-renders
export default memo(Header)
