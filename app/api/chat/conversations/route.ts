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

    // Get all unique conversations for the user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: user.id }, { recipient: user.id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$recipient", user.id] }, { $eq: ["$read", false] }] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.sender",
          foreignField: "_id",
          as: "senderInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.recipient",
          foreignField: "_id",
          as: "recipientInfo",
        },
      },
    ])

    // Format the conversations
    const formattedConversations = conversations.map((conv) => {
      const otherUserId =
        conv.lastMessage.sender.toString() === user.id ? conv.lastMessage.recipient : conv.lastMessage.sender

      const otherUser =
        conv.senderInfo.find((u) => u._id.toString() === otherUserId.toString()) ||
        conv.recipientInfo.find((u) => u._id.toString() === otherUserId.toString())

      return {
        conversationId: conv._id,
        otherUser: {
          _id: otherUser._id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          email: otherUser.email,
        },
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount,
      }
    })

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
