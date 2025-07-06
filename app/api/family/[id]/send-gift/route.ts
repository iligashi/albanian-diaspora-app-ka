import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Gift from "@/models/Gift"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const giftData = await request.json()
    const familyMemberId = params.id

    // Find the user and family member
    const userData = await User.findById(user.id)
    const familyMember = userData.familyMembers.id(familyMemberId)

    if (!familyMember) {
      return NextResponse.json({ message: "Family member not found" }, { status: 404 })
    }

    // Create gift with family member as recipient
    const gift = new Gift({
      user: user.id,
      recipient: {
        name: familyMember.name,
        phone: familyMember.phone,
        address: familyMember.address,
        familyMemberId: familyMemberId,
      },
      category: giftData.category,
      item: giftData.item,
      quantity: giftData.quantity || 1,
      totalAmount: giftData.totalAmount,
      currency: giftData.currency || "EUR",
      message: giftData.message,
      deliveryDate: new Date(giftData.deliveryDate),
      deliveryTime: giftData.deliveryTime || "anytime",
      status: "pending",
    })

    await gift.save()

    return NextResponse.json({
      message: "Gift created successfully",
      gift,
    })
  } catch (error) {
    console.error("Send gift error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
