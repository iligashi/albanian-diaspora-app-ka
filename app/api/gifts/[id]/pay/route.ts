import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Gift from "@/models/Gift"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { paymentMethod, cardDetails } = await request.json()
    const giftId = params.id

    // Find the gift
    const gift = await Gift.findById(giftId)
    if (!gift) {
      return NextResponse.json({ message: "Gift not found" }, { status: 404 })
    }

    // Check if user owns this gift
    if (gift.user.toString() !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Check if already paid
    if (gift.paymentStatus === "paid") {
      return NextResponse.json({ message: "Gift already paid" }, { status: 400 })
    }

    // Simulate payment processing
    gift.paymentStatus = "paid"
    gift.status = "confirmed"
    await gift.save()

    // Update user's total spent
    await User.findByIdAndUpdate(user.id, {
      $inc: { totalSpent: gift.totalAmount },
    })

    // Simulate gift processing
    setTimeout(async () => {
      try {
        gift.status = "preparing"
        await gift.save()
      } catch (err) {
        console.error("Gift processing error:", err)
      }
    }, 2000)

    return NextResponse.json({
      message: "Gift payment completed successfully",
      gift,
    })
  } catch (error) {
    console.error("Gift payment error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
