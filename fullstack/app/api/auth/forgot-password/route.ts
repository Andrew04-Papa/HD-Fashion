import { NextResponse } from "next/server"
import crypto from "crypto"
import { dbAdapter } from "@/lib/db-adapter"

// Store tokens temporarily (in practice should be saved in database)
const resetTokens: Record<string, { email: string; expires: Date }> = {}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Check if email is valid
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Email không hợp lệ" }, { status: 400 })
    }

    try {
      // Check if email exists in the system
      await dbAdapter.ensureTables()
      const result = await dbAdapter.query("SELECT * FROM Users WHERE Email = ?", [email])

      // Generate random tokens
      const resetToken = crypto.randomBytes(32).toString("hex")
      const expiryDate = new Date()
      expiryDate.setHours(expiryDate.getHours() + 1) // Token expires in 1 hour

      // Save token (in practice should be saved to database)
      resetTokens[resetToken] = {
        email,
        expires: expiryDate,
      }

      // In practice, you will be sent an email with a password reset link.
      // For example: sendEmail(email, `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`)

      console.log(`Reset token for ${email}: ${resetToken}`)
      console.log(
        `Reset link: ${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`,
      )

      // Always return success, even if email does not exist (to avoid information disclosure)
      return NextResponse.json({
        message: "If the email exists, password reset instructions will be sent to your email address.",
      })
    } catch (dbError) {
      console.error("Database error:", dbError)

      // Still return success to avoid information disclosure
      return NextResponse.json({
        message: "If the email exists, password reset instructions will be sent to your email address.",
      })
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "An error occurred while processing the request." }, { status: 500 })
  }
}

// Export resetTokens so other routes can access it
export { resetTokens }

