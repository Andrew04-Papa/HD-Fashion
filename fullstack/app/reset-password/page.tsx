"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check token
    const verifyToken = async () => {
      if (!token) {
        setError("Token is invalid or expired")
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Invalid Token")
        }

        setIsValidToken(true)
      } catch (error) {
        setError(error instanceof Error ? error.message : "Token is invalid or expired")
      } finally {
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Check Password
    if (password !== confirmPassword) {
      setError("Confirmation password does not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "An error occurred")
      }

      setSuccess(true)
      toast({
        title: "Password has been reset",
        description: "You can log in with the new password",
      })

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred while resetting password")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-16 md:py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4">Verifying token...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center py-16 md:py-24">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Create a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isValidToken && !isLoading ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                The password reset link is invalid or has expired. Please request a new link.
              </AlertDescription>
            </Alert>
          ) : success ? (
            <Alert className="mb-4">
              <AlertDescription>
               Your password has been reset successfully. You will be redirected to the login page...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                   "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center">
            <Link href="/login" className="text-primary hover:underline">
                Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

