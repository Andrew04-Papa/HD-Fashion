"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { user, login, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check login status when page loads
  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log("Checking login status...")
      const userData = await refreshUser()

      if (userData) {
        console.log("User already logged in, redirecting to home page...")
        // Always redirect to home page
        router.push("/")
      }
    }

    checkLoginStatus()
  }, [refreshUser, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      // First try a simple test request to check if API is working
      try {
        const testResponse = await fetch("/api/test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ test: true }),
        })

        if (!testResponse.ok) {
          console.error("Test API failed:", await testResponse.text())
        } else {
          console.log("Test API succeeded:", await testResponse.json())
        }
      } catch (testError) {
        console.error("Test API error:", testError)
      }

      // Now try the actual login
      await login(email, password)
      // Redirect is handled in login function
    } catch (error) {
      console.error("Login error:", error)
      if (error instanceof Error && error.message.includes("HTML instead of JSON")) {
        setError("Server configuration error. Please try again later or contact support.")
      } else {
        setError(error instanceof Error ? error.message : "An error occurred during login")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Demo login failed")
      }

      // Refresh user data and redirect to home page
      await refreshUser()
      router.push("/")
    } catch (error) {
      console.error("Demo login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during demo login")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container flex items-center justify-center py-16 md:py-24">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Log in</CardTitle>
          <CardDescription>Enter your login information to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={handleDemoLogin} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login with demo account"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">(admin@example.com / admin123)</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up now
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
