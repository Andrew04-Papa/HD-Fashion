"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function useProfileImage() {
  const [isUploading, setIsUploading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const { toast } = useToast()

  const uploadImage = async (file: File) => {
    if (!file) return null

    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size cannot exceed 1MB",
        variant: "destructive",
      })
      return null
    }

    // Check file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG or PNG files are accepted",
        variant: "destructive",
      })
      return null
    }

    // Create a local preview
    const reader = new FileReader()
    reader.onload = (e: any) => {
      setProfileImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // In a real application, you would upload the file to your server
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/account/upload-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image")
      }

      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      })

      return reader.result as string
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return {
    profileImage,
    setProfileImage,
    uploadImage,
    isUploading,
  }
}
