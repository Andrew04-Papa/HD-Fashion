import { NextResponse } from "next/server"
import { resetTokens } from "../forgot-password/route"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ message: "Token not provided" }, { status: 400 })
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

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Verify reset token error:", error)
    return NextResponse.json({ message: "An error occurred while validating the token." }, { status: 500 })
  }
}

