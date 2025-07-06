import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Payment from "@/models/Payment"
import Gift from "@/models/Gift"
import Service from "@/models/Service"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { action, type, ids, updateData } = await request.json()

    let Model
    switch (type) {
      case "payments":
        Model = Payment
        break
      case "gifts":
        Model = Gift
        break
      case "services":
        Model = Service
        break
      default:
        return NextResponse.json({ message: "Invalid type" }, { status: 400 })
    }

    let result
    switch (action) {
      case "delete":
        result = await Model.deleteMany({
          _id: { $in: ids },
          user: user.id,
        })
        break
      case "update":
        result = await Model.updateMany(
          {
            _id: { $in: ids },
            user: user.id,
          },
          { $set: updateData },
        )
        break
      case "export":
        const items = await Model.find({
          _id: { $in: ids },
          user: user.id,
        })
        return NextResponse.json({ items })
      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      affected: result.modifiedCount || result.deletedCount,
      message: `${action} completed successfully`,
    })
  } catch (error) {
    console.error("Bulk operation error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
