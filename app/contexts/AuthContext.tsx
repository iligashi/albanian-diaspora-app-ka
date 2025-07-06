"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import toast from "react-hot-toast"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  phone?: string
  address?: {
    street: string
    city: string
    country: string
    zipCode: string
  }
  kosovoAddress?: {
    street: string
    city: string
    zipCode: string
  }
  preferredCurrency?: string
  language?: string
  familyMembers?: Array<{
    name: string
    relationship: string
    phone: string
    address: string
  }>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  updateProfile: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const response = await fetch("/api/auth/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            localStorage.removeItem("token")
          }
        } catch (error) {
          localStorage.removeItem("token")
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        setUser(data.user)
        toast.success("Login successful!")
      } else {
        toast.error(data.message || "Login failed")
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        setUser(data.user)
        toast.success("Registration successful!")
      } else {
        toast.error(data.message || "Registration failed")
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const updateProfile = async (userData: any) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        toast.success("Profile updated successfully!")
      } else {
        toast.error(data.message || "Update failed")
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    toast.success("Logged out successfully")
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
