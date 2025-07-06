import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Service from "@/models/Service"
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

    const services = await Service.find({ user: user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const total = await Service.countDocuments({ user: user.id })

    return NextResponse.json({
      services,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get services error:", error)
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

    const serviceData = await request.json()

    const service = new Service({
      user: user.id,
      ...serviceData,
      status: "pending",
      paymentStatus: "pending",
    })

    await service.save()

    // Simulate service acceptance
    setTimeout(async () => {
      try {
        service.status = "accepted"
        await service.save()
      } catch (err) {
        console.error("Service acceptance error:", err)
      }
    }, 5000)

    return NextResponse.json(
      {
        message: "Service booking created successfully",
        service,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create service error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
