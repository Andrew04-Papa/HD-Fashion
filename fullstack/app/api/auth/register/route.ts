import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import { dbAdapter } from "@/lib/db-adapter"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Check required fields
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Please fill in all information" }, { status: 400 })
    }

    // Check valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 })
    }

    // Check password strength
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    try {
      // Ensure tables exist
      await dbAdapter.ensureTables()

      // Check if email already exists
      const userExists = await dbAdapter.userExists(email)
      if (userExists) {
        return NextResponse.json({ message: "Email already in use" }, { status: 409 })
      }

      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      // Create new user
      let result
      let newUser: any

      try {
        // Try with SQL Server style OUTPUT clause
        result = await dbAdapter.query(
          "INSERT INTO Users (Name, Email, Password, IsAdmin) OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.IsAdmin VALUES (?, ?, ?, 0)",
          [name, email, hashedPassword],
        )

        // Check result
        if (!result || !result.recordset || result.recordset.length === 0) {
          throw new Error("No user data returned from insert operation")
        }

        newUser = result.recordset[0]
      } catch (insertError) {
        console.error("Error during user insertion with OUTPUT clause:", insertError)

        // Try simpler approach - insert then select
        await dbAdapter.query("INSERT INTO Users (Name, Email, Password, IsAdmin) VALUES (?, ?, ?, 0)", [
          name,
          email,
          hashedPassword,
        ])

        // Then get the created user
        result = await dbAdapter.query("SELECT Id, Name, Email, IsAdmin FROM Users WHERE Email = ?", [email])

        // Check result
        if (!result || !result.recordset || result.recordset.length === 0) {
          throw new Error("Failed to retrieve created user")
        }

        newUser = result.recordset[0]
      }

      // Create JWT token
      const token = sign(
        { id: newUser.Id, email: newUser.Email, isAdmin: newUser.IsAdmin },
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

      return NextResponse.json({
        message: "Registration successful",
        user: {
          id: newUser.Id,
          name: newUser.Name,
          email: newUser.Email,
          isAdmin: newUser.IsAdmin === 1 || newUser.IsAdmin === true,
        },
      })
    } catch (dbError) {
      console.error("Database operation error:", dbError)
      return NextResponse.json(
        { message: "Database error: " + (dbError instanceof Error ? dbError.message : "Unknown error") },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred while registering." }, { status: 500 })
  }
}

