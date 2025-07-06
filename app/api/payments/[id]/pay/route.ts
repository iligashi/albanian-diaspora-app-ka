import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
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

    const { paymentMethod, cardDetails } = await request.json()
    const paymentId = params.id

    // Find the payment
    const payment = await Payment.findById(paymentId)
    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 })
    }

    // Check if user owns this payment
    if (payment.user.toString() !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Check if already paid
    if (payment.status === "completed") {
      return NextResponse.json({ message: "Payment already completed" }, { status: 400 })
    }

    // Simulate payment processing
    payment.status = "processing"
    payment.paymentMethod = paymentMethod
    await payment.save()

    // Simulate payment completion after 3 seconds
    setTimeout(async () => {
      try {
        payment.status = "completed"
        payment.completedAt = new Date()
        await payment.save()

        // Update user's total spent
        await User.findByIdAndUpdate(user.id, {
          $inc: { totalSpent: payment.amount },
        })
      } catch (err) {
        console.error("Payment completion error:", err)
      }
    }, 3000)

    return NextResponse.json({
      message: "Payment processing started",
      payment,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
