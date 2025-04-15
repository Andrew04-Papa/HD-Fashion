import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/components/cart-provider"
import { AuthProvider } from "@/components/auth-provider"
import { WishlistProvider } from "@/components/wishlist-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata = {
  title: "Fashion Store | Your Style, Your Way",
  description: "Discover the latest fashion trends and styles",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <div className="relative flex min-h-screen flex-col">
                  <Header />
                  <div className="flex-1">{children}</div>
                  <Footer />
                </div>
                <Toaster />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
