import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import AdminLog from "@/models/AdminLog"

export async function POST(request: NextRequest) {
  try {
    console.log("Super admin login attempt started")

    const { username, password } = await request.json()
    console.log("Login attempt for username:", username)

    if (!username || !password) {
      console.log("Missing username or password")
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    // Check environment variables
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || "admin"
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin"
    const jwtSecret = process.env.JWT_SECRET || "a3ac3c49cee9e7af1402fce0684f50ec34daecf64acd14d94fffa5b490b3300e"

    console.log("Expected username:", superAdminUsername)
    console.log("JWT Secret exists:", !!jwtSecret)

    if (username !== superAdminUsername) {
      console.log("Username mismatch")
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // For development, allow plain text password comparison
    // In production, you should hash the super admin password
    let passwordValid = false

    if (superAdminPassword.startsWith("$2a$") || superAdminPassword.startsWith("$2b$")) {
      // Password is hashed
      passwordValid = await bcrypt.compare(password, superAdminPassword)
      console.log("Using hashed password comparison:", passwordValid)
    } else {
      // Password is plain text (development only)
      passwordValid = password === superAdminPassword
      console.log("Using plain text password comparison:", passwordValid)
    }

    if (!passwordValid) {
      console.log("Password validation failed")
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    console.log("Credentials validated, connecting to database...")

    try {
      await connectDB()
      console.log("Database connected successfully")
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      // Continue without database for super admin login
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: "super-admin",
        email: "admin@system.com",
        role: "super_admin",
        isSuperAdmin: true,
      },
      jwtSecret,
      { expiresIn: "24h" },
    )

    console.log("JWT token created successfully")

    // Try to log the admin action (non-blocking)
    try {
      const adminLog = new AdminLog({
        admin: "super-admin",
        action: "login",
        details: {
          timestamp: new Date(),
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      })
      await adminLog.save()
      console.log("Admin login logged successfully")
    } catch (logError) {
      console.error("Failed to log admin action (non-critical):", logError)
      // Don't fail the login if logging fails
    }

    // Create response with user data
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: "super-admin",
          email: "admin@system.com",
          firstName: "Super",
          lastName: "Admin",
          role: "super_admin",
          isSuperAdmin: true,
        },
      },
      { status: 200 }
    )

    // Set the token in cookies
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    console.log("Super admin login successful")
    return response
  } catch (error) {
    console.error("Super admin login error:", error)
    return NextResponse.json(
      {
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
