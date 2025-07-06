import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Service from "@/models/Service"
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
    const serviceId = params.id

    // Find the service
    const service = await Service.findById(serviceId)
    if (!service) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 })
    }

    // Check if user owns this service
    if (service.user.toString() !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Check if already paid
    if (service.paymentStatus === "paid") {
      return NextResponse.json({ message: "Service already paid" }, { status: 400 })
    }

    // Simulate payment processing
    service.paymentStatus = "paid"
    service.status = "accepted"
    await service.save()

    // Update user's total spent
    await User.findByIdAndUpdate(user.id, {
      $inc: { totalSpent: service.price },
    })

    // Simulate service acceptance
    setTimeout(async () => {
      try {
        service.status = "in_progress"
        await service.save()
      } catch (err) {
        console.error("Service processing error:", err)
      }
    }, 5000)

    return NextResponse.json({
      message: "Service payment completed successfully",
      service,
    })
  } catch (error) {
    console.error("Service payment error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
