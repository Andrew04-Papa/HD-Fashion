import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    console.log(`[DEBUG] Request to ${request.nextUrl.pathname}`)

    // Continue with the request
    const response = NextResponse.next()

    // Add a header to track middleware execution
    response.headers.set("x-middleware-cache", "no-cache")

    return response
  }

  return NextResponse.next()
}

// Only run this middleware on API routes
export const config = {
  matcher: "/api/:path*",
}

