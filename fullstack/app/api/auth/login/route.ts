import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import { dbAdapter } from "@/lib/db-adapter"

// Ensure we're using the correct runtime
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("Login attempt for:", email)

    // Check required fields
    if (!email || !password) {
      console.log("Missing required fields")
      return NextResponse.json({ message: "Please fill in all required fields" }, { status: 400 })
    }

    // Special handling for demo account
    if (email === "admin@example.com" && password === "admin123") {
      console.log("Demo account login successful")

      const token = sign(
        { id: "demo-1", email: "admin@example.com", isAdmin: true },
        process.env.JWT_SECRET || "your_super_secret_key_change_this_in_production",
        { expiresIn: "7d" },
      )

      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set({
        name: "auth-token",
        value: token,
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      })

      // Always set redirect URL to home page
      const redirectUrl = "/"

      return NextResponse.json({
        message: "Login successful",
        user: {
          id: "demo-1",
          name: "Admin User",
          email: "admin@example.com",
          isAdmin: true,
        },
      })
    }

    try {
      // Make sure the Users table exists
      await dbAdapter.ensureTables()

      // Find users by email
      console.log("Querying database for user:", email)
      const result = await dbAdapter.query("SELECT * FROM Users WHERE Email = ?", [email])

      // If user not found in database
      if (!result.recordset || result.recordset.length === 0) {
        console.log("User not found:", email)
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
      }

      const user = result.recordset[0]
      console.log("User found:", user.Email, "ID:", user.Id)

      // Check Password
      console.log("Comparing passwords")
      const isPasswordValid = await bcrypt.compare(password, user.Password)
      console.log("Password valid:", isPasswordValid)

      if (!isPasswordValid) {
        console.log("Invalid password for user:", email)
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
      }

      // Create JWT token
      console.log("Creating JWT token for user:", user.Email)
      const token = sign(
        {
          id: user.Id,
          email: user.Email,
          isAdmin: user.IsAdmin === 1 || user.IsAdmin === true,
        },
        process.env.JWT_SECRET || "your_super_secret_key_change_this_in_production",
        { expiresIn: "7d" },
      )

      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set({
        name: "auth-token",
        value: token,
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      })

      // Always set redirect URL to home page
      const redirectUrl = "/"

      console.log("Login successful for user:", user.Email)
      return NextResponse.json({
        message: "Login successful",
        user: {
          id: user.Id,
          name: user.Name,
          email: user.Email,
          isAdmin: user.IsAdmin === 1 || user.IsAdmin === true,
        },
      })
    } catch (dbError) {
      console.error("Database error during login:", dbError)

      // If database connection fails, use demo account
      if (email === "admin@example.com" && password === "admin123") {
        console.log("Falling back to demo account after database error")
        const token = sign(
          { id: "demo-1", email: "admin@example.com", isAdmin: true },
          process.env.JWT_SECRET || "your_super_secret_key_change_this_in_production",
          { expiresIn: "7d" },
        )

        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set({
          name: "auth-token",
          value: token,
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        })

        // Always set redirect URL to home page
        const redirectUrl = "/"

        return NextResponse.json({
          message: "Login successful (demo mode)",
          user: {
            id: "demo-1",
            name: "Admin User",
            email: "admin@example.com",
            isAdmin: true,
          },
        })
      }

      return NextResponse.json(
        {
          message:
            "Database connection error. Please try again later or use the demo account: admin@example.com / admin123",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login." }, { status: 500 })
  }
}
