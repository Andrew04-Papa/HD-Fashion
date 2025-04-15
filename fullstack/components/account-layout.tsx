"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface AccountNavProps {
  children: React.ReactNode
}

export function AccountNav({ children }: AccountNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/account", label: "My Profile" },
    { href: "/orders", label: "My Orders" },
    { href: "/wishlist", label: "My Wishlist" },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-64 space-y-4">
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
