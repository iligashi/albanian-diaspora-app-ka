import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Notification from "@/models/Notification"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unread") === "true"
    const skip = (page - 1) * limit

    const query: any = { user: user.id }
    if (unreadOnly) {
      query.read = false
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("relatedItem")

    const unreadCount = await Notification.countDocuments({ user: user.id, read: false })
    const total = await Notification.countDocuments(query)

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { title, message, type, relatedItem } = await request.json()

    const notification = new Notification({
      user: user.id,
      title,
      message,
      type,
      relatedItem,
    })

    await notification.save()

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error("Create notification error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
