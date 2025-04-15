import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/db-adapter"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({
        error: "Missing email or password",
        email: !!email,
        password: !!password,
      })
    }

    // Check if user exists
    try {
      await dbAdapter.ensureTables()
      const result = await dbAdapter.query("SELECT * FROM Users WHERE Email = ?", [email])

      if (!result.recordset || result.recordset.length === 0) {
        return NextResponse.json({
          error: "User not found",
          email,
          userExists: false,
        })
      }

      const user = result.recordset[0]

      // Check password without revealing actual hash
      const passwordMatch = await bcrypt.compare(password, user.Password)

      return NextResponse.json({
        userFound: true,
        passwordMatch,
        userDetails: {
          id: user.Id,
          email: user.Email,
          name: user.Name,
          isAdmin: !!user.IsAdmin,
          passwordLength: user.Password?.length || 0,
        },
      })
    } catch (error) {
      return NextResponse.json({
        error: "Database error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  } catch (error) {
    return NextResponse.json({
      error: "Request processing error",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

