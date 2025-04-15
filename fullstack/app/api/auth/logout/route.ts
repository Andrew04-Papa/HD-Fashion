import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Delete the auth token cookie
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")

  return NextResponse.json({ message: "Logout successful" })
}

