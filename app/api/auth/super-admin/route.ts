import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import AdminLog from "@/models/AdminLog"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { username, password } = await request.json()

    // Check super admin credentials
    if (username !== process.env.SUPER_ADMIN_USERNAME || password !== process.env.SUPER_ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Find or create super admin user
    let superAdmin = await User.findOne({ email: "admin@diasporaconnect.com" })

    if (!superAdmin) {
      superAdmin = new User({
        firstName: "Super",
        lastName: "Admin",
        email: "admin@diasporaconnect.com",
        password: "admin", // This will be hashed by the pre-save hook
        phone: "+1234567890",
        role: "super_admin",
      })
      await superAdmin.save()
    }

    // Update login info
    superAdmin.lastLogin = new Date()
    superAdmin.loginCount += 1
    await superAdmin.save()

    // Generate JWT
    const token = jwt.sign({ id: superAdmin._id, role: "super_admin" }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "24h",
    })

    // Log admin login
    await new AdminLog({
      adminId: superAdmin._id,
      action: "LOGIN",
      targetType: "system",
      details: { loginMethod: "super_admin_credentials" },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    }).save()

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
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
