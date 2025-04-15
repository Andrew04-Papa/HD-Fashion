import type React from "react"
import { Separator } from "@/components/ui/separator"

interface AccountLayoutProps {
  children: React.ReactNode
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your profile information to secure your account</p>
        </div>

        <Separator />

        {children}
      </div>
    </div>
  )
}
