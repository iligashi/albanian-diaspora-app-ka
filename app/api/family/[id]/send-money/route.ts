import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Payment from "@/models/Payment"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { amount, billType, description, paymentMethod } = await request.json()
    const familyMemberId = params.id

    // Find the user and family member
    const userData = await User.findById(user.id)
    const familyMember = userData.familyMembers.id(familyMemberId)

    if (!familyMember) {
      return NextResponse.json({ message: "Family member not found" }, { status: 404 })
    }

    // Create payment
    const payment = new Payment({
      user: user.id,
      recipient: {
        name: familyMember.name,
        phone: familyMember.phone,
        address: familyMember.address,
        familyMemberId: familyMemberId,
      },
      billType: billType || "other",
      amount: Number.parseFloat(amount),
      description: description || `Money transfer to ${familyMember.name}`,
      paymentMethod: paymentMethod || "card",
      status: "processing",
    })

    await payment.save()

    // Simulate payment processing
    setTimeout(async () => {
      try {
        payment.status = "completed"
        payment.completedAt = new Date()
        payment.paymentDate = new Date()
        await payment.save()

        // Update user total spent
        await User.findByIdAndUpdate(user.id, {
          $inc: { totalSpent: payment.amount },
        })
      } catch (err) {
        console.error("Money transfer completion error:", err)
      }
    }, 2000)

    return NextResponse.json({
      message: "Money transfer initiated successfully",
      payment,
    })
  } catch (error) {
    console.error("Send money error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
