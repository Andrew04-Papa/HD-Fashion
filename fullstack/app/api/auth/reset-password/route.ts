import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { resetTokens } from "../forgot-password/route"
import { dbAdapter } from "@/lib/db-adapter"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Check token and password
    if (!token || !password) {
      return NextResponse.json({ message: "Token and password are required" }, { status: 400 })
    }

    // Check password length
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if token exists
    const tokenData = resetTokens[token]
    if (!tokenData) {
      return NextResponse.json({ message: "Invalid Token" }, { status: 400 })
    }

    // Check if token is expired
    if (new Date() > tokenData.expires) {
      delete resetTokens[token] // Delete expired tokens
      return NextResponse.json({ message: "Token has expired" }, { status: 400 })
    }

    try {
      // Encrypt new password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Update password in database
      await dbAdapter.ensureTables()
      await dbAdapter.query("UPDATE Users SET Password = ? WHERE Email = ?", [hashedPassword, tokenData.email])

      // Delete used tokens
      delete resetTokens[token]

      return NextResponse.json({ message: "Password was reset successfully" })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ message: "An error occurred while resetting password." }, { status: 500 })
    }
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ message: "An error occurred while processing the request." }, { status: 500 })
  }
}

