import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Payment from "@/models/Payment"
import Gift from "@/models/Gift"
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
    const period = searchParams.get("period") || "30" // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Get spending analytics
    const spendingByCategory = await Payment.aggregate([
      { $match: { user: user.id, createdAt: { $gte: startDate } } },
      { $group: { _id: "$billType", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])

    const monthlySpending = await Payment.aggregate([
      { $match: { user: user.id, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get gift analytics
    const giftsByCategory = await Gift.aggregate([
      { $match: { user: user.id, createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get service analytics
    const servicesByCategory = await Service.aggregate([
      { $match: { user: user.id, createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", total: { $sum: "$price" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get recent activity trends
    const activityTrends = await Promise.all([
      Payment.countDocuments({ user: user.id, createdAt: { $gte: startDate } }),
      Gift.countDocuments({ user: user.id, createdAt: { $gte: startDate } }),
      Service.countDocuments({ user: user.id, createdAt: { $gte: startDate } }),
    ])

    return NextResponse.json({
      spendingByCategory,
      monthlySpending,
      giftsByCategory,
      servicesByCategory,
      activityTrends: {
        payments: activityTrends[0],
        gifts: activityTrends[1],
        services: activityTrends[2],
      },
      period: Number.parseInt(period),
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
