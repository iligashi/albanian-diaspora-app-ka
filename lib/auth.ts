import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { connectDB } from "./mongodb"
import User from "@/models/User"

const JWT_SECRET = process.env.JWT_SECRET || "a3ac3c49cee9e7af1402fce0684f50ec34daecf64acd14d94fffa5b490b3300e"

export async function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    await connectDB()
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export function generateToken(userId: string, role = "user") {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" })
}
