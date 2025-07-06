import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { firstName, lastName, email, password, phone } = await request.json()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id.toString(), user.role)

    return NextResponse.json(
      {
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isPremium: user.isPremium,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
