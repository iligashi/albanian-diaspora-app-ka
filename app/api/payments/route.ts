import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Payment from "@/models/Payment"
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

    const payments = await Payment.find({ user: user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName")

    const total = await Payment.countDocuments({ user: user.id })

    return NextResponse.json({
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get payments error:", error)
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

    const paymentData = await request.json()

    const payment = new Payment({
      user: user.id,
      ...paymentData,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "processing",
    })

    await payment.save()

    // Simulate payment processing
    setTimeout(async () => {
      try {
        payment.status = "completed"
        payment.completedAt = new Date()
        await payment.save()
      } catch (err) {
        console.error("Payment completion error:", err)
      }
    }, 3000)

    return NextResponse.json(
      {
        message: "Payment initiated successfully",
        payment,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create payment error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
