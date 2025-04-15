"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

export default function AccountPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState("Admin User")
  const [username, setUsername] = useState("admin")
  const [email, setEmail] = useState("admin@example.com")
  const [phone, setPhone] = useState("**********24")
  const [gender, setGender] = useState("male")
  const [birthDate, setBirthDate] = useState("**/*/2004")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newBirthDate, setNewBirthDate] = useState("")

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (user) {
      setName(user.name || "Admin User")
      setUsername(user.email?.split("@")[0] || "admin")
      setEmail(user.email || "admin@example.com")
      // Set default values for other fields if available in user object
    }
  }, [user])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size cannot exceed 1MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG or PNG files are accepted",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    // Create a local preview
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.readyState === 2) {
        setProfileImage(reader.result as string)

        // Show success toast
        toast({
          title: "Success",
          description: "Profile image uploaded successfully",
        })
      }
    }
    reader.readAsDataURL(file)
    setIsUploading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Apply changes from editing fields
      if (isEditingEmail && newEmail) {
        setEmail(newEmail)
        setIsEditingEmail(false)
      }

      if (isEditingPhone && newPhone) {
        setPhone(newPhone)
        setIsEditingPhone(false)
      }

      if (isEditingBirthDate && newBirthDate) {
        setBirthDate(newBirthDate)
        setIsEditingBirthDate(false)
      }

      toast({
        title: "Success",
        description: "Account information has been updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update account information",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-16 md:py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your profile information to secure your account</p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <div className="col-span-2">
                  <p className="py-2">{username}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <div className="col-span-2">
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-md" />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <div className="col-span-2 flex items-center gap-2">
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="max-w-md"
                      />
                      <Button type="button" variant="outline" onClick={() => setIsEditingEmail(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="py-2">{email}</p>
                      <Button
                        variant="link"
                        className="text-blue-500 h-auto p-0"
                        onClick={() => {
                          setNewEmail(email)
                          setIsEditingEmail(true)
                        }}
                      >
                        Change
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone number
                </Label>
                <div className="col-span-2 flex items-center gap-2">
                  {isEditingPhone ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="max-w-md"
                      />
                      <Button type="button" variant="outline" onClick={() => setIsEditingPhone(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="py-2">{phone}</p>
                      <Button
                        variant="link"
                        className="text-blue-500 h-auto p-0"
                        onClick={() => {
                          setNewPhone(phone.includes("*") ? "" : phone)
                          setIsEditingPhone(true)
                        }}
                      >
                        Change
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Gender</Label>
                <div className="col-span-2">
                  <RadioGroup value={gender} onValueChange={setGender} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="birthDate" className="text-right">
                  Date of birth
                </Label>
                <div className="col-span-2 flex items-center gap-2">
                  {isEditingBirthDate ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={newBirthDate}
                        onChange={(e) => setNewBirthDate(e.target.value)}
                        className="max-w-md"
                      />
                      <Button type="button" variant="outline" onClick={() => setIsEditingBirthDate(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="py-2">{birthDate}</p>
                      <Button
                        variant="link"
                        className="text-blue-500 h-auto p-0"
                        onClick={() => {
                          setNewBirthDate("")
                          setIsEditingBirthDate(true)
                        }}
                      >
                        Change
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 pt-4">
                <div className="col-start-2 col-span-2">
                  <Button type="submit" disabled={isSaving} className="bg-red-500 hover:bg-red-600">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border">
              <Image
                src={profileImage || "/placeholder.svg?height=128&width=128"}
                alt="Profile picture"
                fill
                className="object-cover"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Choose Image"
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-muted-foreground text-center">
              Maximum file size 1 MB
              <br />
              Format: JPEG, PNG
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
