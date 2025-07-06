import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Notification from "@/models/Notification"
import { verifyToken } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, user: user.id },
      { read: true, readAt: new Date() },
      { new: true },
    )

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Mark notification read error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
