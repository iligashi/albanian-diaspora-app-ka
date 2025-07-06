import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Gift from "@/models/Gift"
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
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const gifts = await Gift.find({ user: user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const total = await Gift.countDocuments({ user: user.id })

    return NextResponse.json({
      gifts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get gifts error:", error)
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

    const giftData = await request.json()

    const gift = new Gift({
      user: user.id,
      ...giftData,
      trackingNumber: `GFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      paymentStatus: "paid",
    })

    await gift.save()

    // Simulate gift processing
    setTimeout(async () => {
      try {
        gift.status = "confirmed"
        await gift.save()
      } catch (err) {
        console.error("Gift confirmation error:", err)
      }
    }, 2000)

    return NextResponse.json(
      {
        message: "Gift order created successfully",
        gift,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create gift error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
