"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export type User = {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  // Use useCallback to prevent unnecessary re-renders
  const refreshUser = useCallback(async () => {
    try {
      // Throttle refreshes to prevent excessive API calls
      const now = Date.now()
      if (now - lastRefresh < 2000) {
        // Don't refresh more than once every 2 seconds
        return user
      }

      setLastRefresh(now)
      console.log("Refreshing user data...")

      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      })

      if (response.ok) {
        const userData = await response.json()
        console.log("User data refreshed:", userData)
        setUser(userData.user)
        return userData.user
      } else {
        console.log("Failed to refresh user data, status:", response.status)
        if (user) setUser(null)
      }
      return null
    } catch (error) {
      console.error("Authentication check failed:", error)
      if (user) setUser(null)
      return null
    }
  }, [user, lastRefresh])

  useEffect(() => {
    // Check if user is logged in when page loads
    const checkAuth = async () => {
      try {
        await refreshUser()
      } catch (error) {
        console.error("Authentication check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log("Attempting login for:", email)

      // Now proceed with actual login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      // Check if response is HTML instead of JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        console.error("Received HTML response instead of JSON")
        throw new Error("Server error: Received HTML instead of JSON response")
      }

      let data
      try {
        const text = await response.text()
        try {
          data = JSON.parse(text)
          console.log("Login response data:", data)
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError)
          console.error("Raw response:", text.substring(0, 200) + "...")
          throw new Error("Invalid JSON response from server")
        }
      } catch (textError) {
        console.error("Error reading response text:", textError)
        throw new Error("Failed to read server response")
      }

      if (!response.ok) {
        throw new Error(data?.message || "Login failed")
      }

      if (!data?.user) {
        console.error("No user data in response:", data)
        throw new Error("Invalid response from server")
      }

      setUser(data.user)
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      })

      // Always redirect to home page after login
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || "Registration failed")
      }

      setUser(data.user)
      setLastRefresh(Date.now())

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
      })

      // Always redirect to home page after registration
      router.push("/")

      return data.user
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      setUser(null)
      setLastRefresh(Date.now())

      toast({
        title: "Logout successful",
        description: "You have been logged out of your account",
      })

      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
