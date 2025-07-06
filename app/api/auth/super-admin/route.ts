import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import AdminLog from "@/models/AdminLog"

export async function POST(request: NextRequest) {
  try {
    console.log("Super admin login attempt...")

    await connectDB()
    console.log("Database connected")

    const body = await request.json()
    console.log("Request body:", { username: body.username, hasPassword: !!body.password })

    const { username, password } = body

    // Check super admin credentials
    const expectedUsername = process.env.SUPER_ADMIN_USERNAME || "admin"
    const expectedPassword = process.env.SUPER_ADMIN_PASSWORD || "admin"

    console.log("Expected credentials:", { username: expectedUsername, password: expectedPassword })
    console.log("Provided credentials:", { username, password })

    if (username !== expectedUsername || password !== expectedPassword) {
      console.log("Invalid credentials provided")
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    console.log("Credentials valid, finding/creating super admin user...")

    // Find or create super admin user
    let superAdmin = await User.findOne({ email: "admin@diasporaconnect.com" })

    if (!superAdmin) {
      console.log("Creating new super admin user...")
      superAdmin = new User({
        firstName: "Super",
        lastName: "Admin",
        email: "admin@diasporaconnect.com",
        password: "admin123", // This will be hashed by the pre-save hook
        phone: "+1234567890",
        role: "super_admin",
      })
      await superAdmin.save()
      console.log("Super admin user created")
    } else {
      console.log("Super admin user found")
    }

    // Update login info
    superAdmin.lastLogin = new Date()
    superAdmin.loginCount = (superAdmin.loginCount || 0) + 1
    await superAdmin.save()

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-for-development"
    const token = jwt.sign({ id: superAdmin._id, role: "super_admin" }, jwtSecret, { expiresIn: "24h" })

    console.log("JWT token generated")

    // Log admin login
    try {
      await new AdminLog({
        adminId: superAdmin._id,
        action: "LOGIN",
        targetType: "system",
        details: { loginMethod: "super_admin_credentials" },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }).save()
      console.log("Admin log created")
    } catch (logError) {
      console.error("Error creating admin log:", logError)
      // Don't fail the login if logging fails
    }

    console.log("Super admin login successful")

    return NextResponse.json({
      message: "Super admin login successful",
      token,
      user: {
        id: superAdmin._id,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    })
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
