import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { dbAdapter } from "@/lib/db-adapter"

// Set runtime to node to use jsonwebtoken
export const runtime = "nodejs"

export async function GET() {
  try {
    // Get token from cookie
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Authentication token not found" }, { status: 401 })
    }

    // Verify token
    try {
      const decoded = verify(token, process.env.JWT_SECRET || "your_super_secret_key_change_this_in_production") as {
        id: string
        email: string
        isAdmin: boolean
      }

      // Handle demo account
      if (decoded.id === "demo-1" && decoded.email === "admin@example.com") {
        return NextResponse.json({
          user: {
            id: "demo-1",
            name: "Admin User",
            email: "admin@example.com",
            isAdmin: true,
          },
        })
      }

      try {
        // Ensure tables exist
        await dbAdapter.ensureTables()

        // Get user information from database
        const result = await dbAdapter.query("SELECT Id, Name, Email, IsAdmin FROM Users WHERE Id = ?", [decoded.id])

        if (!result.recordset || result.recordset.length === 0) {
          cookieStore.delete("auth-token")
          return NextResponse.json({ message: "User does not exist" }, { status: 401 })
        }

        const user = result.recordset[0]

        return NextResponse.json({
          user: {
            id: user.Id,
            name: user.Name,
            email: user.Email,
            isAdmin: user.IsAdmin === 1 || user.IsAdmin === true,
          },
        })
      } catch (dbError) {
        console.error("Database error:", dbError)

        // If demo account, still return user info
        if (decoded.email === "admin@example.com") {
          return NextResponse.json({
            user: {
              id: "demo-1",
              name: "Admin User",
              email: "admin@example.com",
              isAdmin: true,
            },
          })
        }

        throw dbError
      }
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError)
      cookieStore.delete("auth-token")
      return NextResponse.json({ message: "Invalid login session" }, { status: 401 })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")
    return NextResponse.json({ message: "Invalid login session" }, { status: 401 })
  }
}

