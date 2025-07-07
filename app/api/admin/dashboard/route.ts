import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Payment from "@/models/Payment"
import Gift from "@/models/Gift"
import Service from "@/models/Service"
import AdminLog from "@/models/AdminLog"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    // Check for token in Authorization header first
    const authHeader = request.headers.get('authorization')
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      // If not in header, check cookies
      const cookieToken = request.cookies.get('admin_token')?.value
      if (cookieToken) {
        token = cookieToken
      }
    }
    
    if (!token) {
      console.error('No authentication token found')
      return NextResponse.json({ message: "No authentication token provided" }, { status: 401 })
    }
    
    // Verify the token
    const user = jwt.verify(token, process.env.JWT_SECRET || '') as any
    
    if (!user || user.role !== "super_admin") {
      console.error('Invalid or missing user role')
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get current date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // User stats
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

    // Payment stats
    const totalPayments = await Payment.countDocuments()
    const completedPayments = await Payment.countDocuments({ status: "completed" })
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Gift stats
    const totalGifts = await Gift.countDocuments()
    const deliveredGifts = await Gift.countDocuments({ status: "delivered" })
    const pendingGifts = await Gift.countDocuments({ status: { $in: ["pending", "confirmed", "preparing"] } })

    // Service stats
    const totalServices = await Service.countDocuments()
    const completedServices = await Service.countDocuments({ status: "completed" })
    const pendingServices = await Service.countDocuments({ status: { $in: ["pending", "accepted", "in_progress"] } })

    // Recent activity
    const recentLogs = await AdminLog.find().populate("adminId", "firstName lastName").sort({ createdAt: -1 }).limit(10)

    const recentUsers = await User.find({ role: { $ne: "super_admin" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email isPremium createdAt")

    const recentPayments = await Payment.find().populate("user", "firstName lastName").sort({ createdAt: -1 }).limit(5)

    // Revenue by month (last 6 months)
    const revenueByMonth = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    const formattedRevenueByMonth = revenueByMonth.map((item) => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
      revenue: item.revenue,
    }))

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
        newThisMonth: newUsersThisMonth,
        growth: 0, // Calculate growth percentage if needed
      },
      payments: {
        total: totalPayments,
        completed: completedPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
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
    }

    const recentActivity = {
      logs: recentLogs,
      users: recentUsers,
      payments: recentPayments,
    }

    const analytics = {
      revenueByMonth: formattedRevenueByMonth,
    }

    return NextResponse.json({
      stats,
      recentActivity,
      analytics,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
