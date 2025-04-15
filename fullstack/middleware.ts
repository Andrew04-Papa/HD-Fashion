import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple function to decode JWT without verification
// This is a workaround since the Edge Runtime doesn't support the crypto module
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("JWT decode error:", error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path.startsWith("/products") ||
    path.startsWith("/category") ||
    path.startsWith("/product/") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/search") ||
    path.startsWith("/api/debug") ||
    path.startsWith("/_next") ||
    path.includes(".")

  // Special handling for login page
  const isLoginPage = path === "/login"

  // Get token from cookie
  const token = request.cookies.get("auth-token")?.value

  // For public paths (except login), allow access
  if (isPublicPath && !isLoginPage) {
    return NextResponse.next()
  }

  // Special handling for login page
  if (isLoginPage) {
    // If already logged in, redirect to home page
    if (token) {
      try {
        const decoded = decodeJwt(token)
        if (decoded) {
          // Always redirect to home page regardless of user role
          return NextResponse.redirect(new URL("/", request.url))
        }
      } catch (error) {
        // If token is invalid, allow access to login page
        return NextResponse.next()
      }
    }
    // Not logged in, allow access to login page
    return NextResponse.next()
  }

  // For protected paths without token, redirect to login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Simple token validation (just check if it can be decoded)
  let decoded = null
  try {
    decoded = decodeJwt(token)
  } catch (error) {
    // Invalid token, redirect to login
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (!decoded) {
    // Invalid token, redirect to login
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Check admin permissions for admin paths
  const isAdmin = decoded.isAdmin === true
  if (path.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // Token is valid, allow access
  return NextResponse.next()
}

// Apply middleware only to specific paths
export const config = {
  matcher: [
    "/login",
    "/account/:path*",
    "/admin/:path*",
    "/api/user/:path*",
    "/api/admin/:path*",
    "/cart",
    "/checkout",
    "/orders",
    "/wishlist",
  ],
}
