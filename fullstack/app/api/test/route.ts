import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "API is working correctly" })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({
      message: "POST request successful",
      receivedData: body,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to parse request body",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    )
  }
}

