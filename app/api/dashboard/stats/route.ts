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

    // Get statistics
    const [totalPayments, completedPayments, totalGifts, deliveredGifts, totalServices, completedServices] =
      await Promise.all([
        Payment.countDocuments({ user: user.id }),
        Payment.find({ user: user.id, status: "completed" }),
        Gift.countDocuments({ user: user.id }),
        Gift.countDocuments({ user: user.id, status: "delivered" }),
        Service.countDocuments({ user: user.id }),
        Service.countDocuments({ user: user.id, status: "completed" }),
      ])

    // Calculate total spent
    const totalSpent = completedPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Get recent activity
    const [recentPayments, recentGifts, recentServices] = await Promise.all([
      Payment.find({ user: user.id }).sort({ createdAt: -1 }).limit(3),
      Gift.find({ user: user.id }).sort({ createdAt: -1 }).limit(3),
      Service.find({ user: user.id }).sort({ createdAt: -1 }).limit(3),
    ])

    const recentActivity = [
      ...recentPayments.map((p) => ({
        id: p._id,
        type: "payment",
        description: `${p.billType} bill payment for ${p.recipient.name}`,
        amount: p.amount,
        status: p.status,
        date: p.createdAt,
      })),
      ...recentGifts.map((g) => ({
        id: g._id,
        type: "gift",
        description: `${g.item.name} sent to ${g.recipient.name}`,
        amount: g.totalAmount,
        status: g.status,
        date: g.createdAt,
      })),
      ...recentServices.map((s) => ({
        id: s._id,
        type: "service",
        description: `${s.category} service booked`,
        amount: s.price,
        status: s.status,
        date: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        totalPayments,
        totalSpent,
        pendingServices: await Service.countDocuments({ user: user.id, status: { $in: ["pending", "accepted"] } }),
        completedGifts: deliveredGifts,
      },
      recentActivity,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
