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

    const { amount, description } = await request.json()
    const familyMemberId = params.id

    // Find the user and family member
    const currentUser = await User.findById(user.id)
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const familyMember = currentUser.familyMembers.id(familyMemberId)
    if (!familyMember) {
      return NextResponse.json({ message: "Family member not found" }, { status: 404 })
    }

    // Create a payment record for money transfer
    const payment = new Payment({
      user: user.id,
      recipient: {
        name: familyMember.name,
        phone: familyMember.phone,
        address: familyMember.address,
      },
      billType: "other",
      amount: Number.parseFloat(amount),
      currency: currentUser.preferredCurrency || "EUR",
      status: "processing",
      paymentMethod: "bank_transfer",
      description: description || `Money transfer to ${familyMember.name}`,
      transactionId: `MT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })

    await payment.save()

    // Simulate money transfer completion
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
        console.error("Money transfer completion error:", err)
      }
    }, 2000)

    return NextResponse.json(
      {
        message: "Money transfer initiated successfully",
        payment,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send money error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
