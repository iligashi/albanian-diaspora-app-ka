import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Service from "@/models/Service"
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
    const serviceId = params.id

    const service = await Service.findOne({ _id: serviceId, user: user.id })
    if (!service) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 })
    }

    if (service.paymentStatus === "paid") {
      return NextResponse.json({ message: "Service already paid" }, { status: 400 })
    }

    // Create payment record for the service
    const payment = new Payment({
      user: user.id,
      recipient: {
        name: service.contactPerson?.name || "Service Provider",
        address: service.address,
        phone: service.contactPerson?.phone,
      },
      billType: "other",
      amount: service.totalCost || service.price,
      currency: service.currency,
      description: `Payment for service: ${service.title}`,
      paymentMethod: paymentMethod,
      status: "processing",
    })

    await payment.save()

    // Link payment to service
    service.paymentId = payment._id
    service.paymentStatus = "paid"
    if (service.status === "pending") {
      service.status = "accepted"
    }
    await service.save()

    // Simulate payment processing
    setTimeout(async () => {
      try {
        payment.status = "completed"
        payment.completedAt = new Date()
        payment.paymentDate = new Date()
        await payment.save()

        // Update user total spent
        await User.findByIdAndUpdate(user.id, {
          $inc: { totalSpent: service.totalCost || service.price },
        })
      } catch (err) {
        console.error("Service payment completion error:", err)
      }
    }, 3000)

    return NextResponse.json({
      message: "Service payment processed successfully",
      service,
      payment,
    })
  } catch (error) {
    console.error("Service payment error:", error)
    return NextResponse.json({ message: "Payment processing failed" }, { status: 500 })
  }
}
