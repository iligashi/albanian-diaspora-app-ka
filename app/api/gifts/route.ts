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

    const gifts = await Gift.find({ user: user.id }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ gifts }, { status: 200 })
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

    const body = await request.json()
    console.log("Gift creation request body:", body)

    const {
      title,
      description,
      price,
      category,
      recipientName,
      recipientAddress,
      deliveryDate,
      recipient,
      item,
      quantity,
      totalAmount,
      message,
    } = body

    // Handle both old and new gift formats
    const giftData = {
      user: user.id,
      recipient: recipient || {
        name: recipientName,
        phone: "",
        address: recipientAddress,
      },
      category: category || "other",
      item: item || {
        name: title || "Gift",
        description: description || "",
        price: price || 0,
      },
      quantity: quantity || 1,
      totalAmount: totalAmount || price || 0,
      message: message || {
        text: description || "",
      },
      deliveryDate: deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: `GFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      paymentStatus: "pending",
    }

    console.log("Creating gift with data:", giftData)

    const gift = new Gift(giftData)
    await gift.save()

    console.log("Gift created successfully:", gift._id)

    return NextResponse.json(
      {
        message: "Gift created successfully",
        gift,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create gift error:", error)
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { giftIds, action } = await request.json()

    if (!giftIds || !Array.isArray(giftIds) || giftIds.length === 0) {
      return NextResponse.json({ message: "Gift IDs are required" }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ message: "Action is required" }, { status: 400 })
    }

    const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    if (!validStatuses.includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    const result = await Gift.updateMany(
      {
        _id: { $in: giftIds },
        user: user.id,
      },
      {
        status: action,
        ...(action === "delivered" && { deliveredAt: new Date() }),
      },
    )

    return NextResponse.json(
      {
        message: `Successfully updated ${result.modifiedCount} gifts`,
        modifiedCount: result.modifiedCount,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Bulk update gifts error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
