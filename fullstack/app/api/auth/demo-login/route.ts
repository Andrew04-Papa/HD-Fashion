import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"

// Set runtime to node to use jsonwebtoken
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("Direct demo login endpoint called")

    // Create token for demo account
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

    // Always redirect to home page
    const redirectUrl = "/"

    return NextResponse.json({
      success: true,
      message: "Demo login successful",
      user: {
        id: "demo-1",
        name: "Admin User",
        email: "admin@example.com",
        isAdmin: true,
      },
      redirectUrl,
    })
  } catch (error) {
    console.error("Demo login error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during demo login." }, { status: 500 })
  }
}
