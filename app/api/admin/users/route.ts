import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import AdminLog from "@/models/AdminLog"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const filter = searchParams.get("filter") || "all"
    const skip = (page - 1) * limit

    // Build query
    const query: any = { role: { $ne: "super_admin" } }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    if (filter !== "all") {
      switch (filter) {
        case "premium":
          query.isPremium = true
          break
        case "active":
          query.lastLogin = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          break
        case "inactive":
          query.$or = [
            { lastLogin: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            { lastLogin: { $exists: false } },
          ]
          break
      }
    }

    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password")

    const total = await User.countDocuments(query)

    return NextResponse.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyToken(request)
    if (!admin || admin.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { userId, updates } = await request.json()

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select(
      "-password",
    )

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Log admin action
    await new AdminLog({
      adminId: admin.id,
      action: "UPDATE_USER",
      targetType: "user",
      targetId: userId,
      details: { updates },
    }).save()

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
