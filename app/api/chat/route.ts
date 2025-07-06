import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Message from "@/models/Message"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const query: any = {
      $or: [{ sender: user.id }, { recipient: user.id }],
    }

    if (conversationId) {
      query.conversationId = conversationId
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "firstName lastName")
      .populate("recipient", "firstName lastName")

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("Get messages error:", error)
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

    const { recipient, message, type = "text", attachments = [] } = await request.json()

    const conversationId = [user.id, recipient].sort().join("-")

    const newMessage = new Message({
      sender: user.id,
      recipient,
      conversationId,
      message,
      type,
      attachments,
      read: false,
    })

    await newMessage.save()
    await newMessage.populate("sender", "firstName lastName")
    await newMessage.populate("recipient", "firstName lastName")

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
