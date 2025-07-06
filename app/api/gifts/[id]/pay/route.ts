import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Gift from "@/models/Gift"
import Payment from "@/models/Payment"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { paymentMethod } = await request.json()
    const giftId = params.id

    const gift = await Gift.findOne({ _id: giftId, user: user.id })
    if (!gift) {
      return NextResponse.json({ message: "Gift not found" }, { status: 404 })
    }

    if (gift.paymentStatus === "paid") {
      return NextResponse.json({ message: "Gift already paid" }, { status: 400 })
    }

    // Create payment record for the gift
    const payment = new Payment({
      user: user.id,
      recipient: gift.recipient,
      billType: "other",
      amount: gift.finalAmount,
      currency: gift.currency,
      description: `Payment for gift: ${gift.item.name}`,
      paymentMethod: paymentMethod,
      status: "processing",
    })

    await payment.save()

    // Link payment to gift
    gift.paymentId = payment._id
    gift.paymentStatus = "paid"
    gift.status = "confirmed"
    await gift.save()

    // Simulate payment processing
    setTimeout(async () => {
      try {
        payment.status = "completed"
        payment.completedAt = new Date()
        payment.paymentDate = new Date()
        await payment.save()

        // Update user total spent
        await User.findByIdAndUpdate(user.id, {
          $inc: { totalSpent: gift.finalAmount },
        })
      } catch (err) {
        console.error("Gift payment completion error:", err)
      }
    }, 3000)

    return NextResponse.json({
      message: "Gift payment processed successfully",
      gift,
      payment,
    })
  } catch (error) {
    console.error("Gift payment error:", error)
    return NextResponse.json({ message: "Payment processing failed" }, { status: 500 })
  }
}
