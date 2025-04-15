import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: "No image provided" }, { status: 400 })
    }

    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      return NextResponse.json({ success: false, message: "File size exceeds 1MB limit" }, { status: 400 })
    }

    // Check file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json({ success: false, message: "Only JPEG and PNG formats are accepted" }, { status: 400 })
    }

    // In a real application, you would save the file to a storage service
    // For this example, we'll just return success

    return NextResponse.json({
      success: true,
      message: "Profile image uploaded successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
