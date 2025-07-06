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

    const { category, itemName, itemDescription, price, quantity, message, deliveryDate } = await request.json()
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

    // Create gift
    const gift = new Gift({
      user: user.id,
      recipient: {
        name: familyMember.name,
        phone: familyMember.phone,
        address: familyMember.address,
        familyMemberId: familyMemberId,
      },
      category: category || "other",
      item: {
        name: itemName || "Special Gift",
        description: itemDescription,
        price: Number.parseFloat(price) || 25.0,
      },
      quantity: Number.parseInt(quantity) || 1,
      totalAmount: (Number.parseFloat(price) || 25.0) * (Number.parseInt(quantity) || 1),
      message: {
        text: message,
      },
      deliveryDate: deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      trackingNumber: `GFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      paymentStatus: "pending",
    })

    await gift.save()

    return NextResponse.json(
      {
        message: "Gift created successfully",
        gift,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send gift error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
