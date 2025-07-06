import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, password } = await request.json()

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Update login info
    user.lastLogin = new Date()
    user.loginCount += 1
    await user.save()

    // Generate token
    const token = generateToken(user._id.toString(), user.role)

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        phone: user.phone,
        address: user.address,
        kosovoAddress: user.kosovoAddress,
        familyMembers: user.familyMembers,
        preferredCurrency: user.preferredCurrency,
        language: user.language,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
