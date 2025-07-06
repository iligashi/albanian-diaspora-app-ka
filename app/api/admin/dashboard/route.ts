import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Payment from "@/models/Payment"
import Gift from "@/models/Gift"
import Service from "@/models/Service"
import AdminLog from "@/models/AdminLog"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get current date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // User statistics
    const totalUsers = await User.countDocuments({ role: { $ne: "super_admin" } })
    const activeUsers = await User.countDocuments({
      role: { $ne: "super_admin" },
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
    const premiumUsers = await User.countDocuments({ isPremium: true })
    const newUsersThisMonth = await User.countDocuments({
      role: { $ne: "super_admin" },
      createdAt: { $gte: startOfMonth },
    })

    // Payment statistics
    const totalPayments = await Payment.countDocuments()
    const completedPayments = await Payment.find({ status: "completed" })
    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const monthlyRevenue = completedPayments
      .filter((payment) => payment.createdAt >= startOfMonth)
      .reduce((sum, payment) => sum + payment.amount, 0)

    // Gift statistics
    const totalGifts = await Gift.countDocuments()
    const deliveredGifts = await Gift.countDocuments({ status: "delivered" })
    const pendingGifts = await Gift.countDocuments({ status: { $in: ["pending", "confirmed", "preparing"] } })

    // Service statistics
    const totalServices = await Service.countDocuments()
    const completedServices = await Service.countDocuments({ status: "completed" })
    const pendingServices = await Service.countDocuments({ status: { $in: ["pending", "accepted"] } })

    // Recent activity
    const recentUsers = await User.find({ role: { $ne: "super_admin" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email createdAt isPremium")

    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5).populate("user", "firstName lastName")

    const recentLogs = await AdminLog.find().sort({ createdAt: -1 }).limit(10).populate("adminId", "firstName lastName")

    // Growth metrics
    const lastMonthUsers = await User.countDocuments({
      role: { $ne: "super_admin" },
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    })
    const userGrowth = lastMonthUsers > 0 ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 : 0

    // Revenue by month (last 6 months)
    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthPayments = await Payment.find({
        status: "completed",
        createdAt: { $gte: monthStart, $lte: monthEnd },
      })

      const monthRevenue = monthPayments.reduce((sum, payment) => sum + payment.amount, 0)

      revenueByMonth.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthRevenue,
        count: monthPayments.length,
      })
    }

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          premium: premiumUsers,
          newThisMonth: newUsersThisMonth,
          growth: userGrowth,
        },
        payments: {
          total: totalPayments,
          completed: completedPayments.length,
          totalRevenue,
          monthlyRevenue,
        },
        gifts: {
          total: totalGifts,
          delivered: deliveredGifts,
          pending: pendingGifts,
        },
        services: {
          total: totalServices,
          completed: completedServices,
          pending: pendingServices,
        },
      },
      recentActivity: {
        users: recentUsers,
        payments: recentPayments,
        logs: recentLogs,
      },
      analytics: {
        revenueByMonth,
      },
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
