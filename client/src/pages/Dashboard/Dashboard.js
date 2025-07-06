"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { CreditCard, Gift, Wrench, TrendingUp, Clock, CheckCircle, AlertCircle, Euro } from "lucide-react"

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalSpent: 0,
    pendingServices: 0,
    completedGifts: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // In a real app, you'd have a dedicated dashboard endpoint
      // For now, we'll simulate the data
      setStats({
        totalPayments: 12,
        totalSpent: 2450.0,
        pendingServices: 3,
        completedGifts: 8,
      })

      setRecentActivity([
        {
          id: 1,
          type: "payment",
          description: "Electricity bill payment for Pristina apartment",
          amount: 85.5,
          status: "completed",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          type: "gift",
          description: "Birthday flowers delivered to mother",
          amount: 45.0,
          status: "delivered",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          type: "service",
          description: "Home cleaning service booked",
          amount: 120.0,
          status: "pending",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ])

      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Pay Bills",
      description: "Pay electricity, water, rent and other bills",
      icon: CreditCard,
      link: "/payments",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Send Gifts",
      description: "Send flowers, cakes and gifts to loved ones",
      icon: Gift,
      link: "/gifts",
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      title: "Book Services",
      description: "Schedule cleaning, repairs and other services",
      icon: Wrench,
      link: "/services",
      color: "bg-green-500 hover:bg-green-600",
    },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getActivityTypeColor = (type) => {
    switch (type) {
      case "payment":
        return "bg-blue-100 text-blue-800"
      case "gift":
        return "bg-pink-100 text-pink-800"
      case "service":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user.firstName}! 👋</h1>
        <p className="text-red-100">Manage your family's needs in Kosovo from anywhere in the world.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Services</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Gift className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gifts Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedGifts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.color} transition-colors mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-600">{action.description}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <Link to="/payments" className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors">
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow">
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">{getStatusIcon(activity.status)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}
                        >
                          {activity.type}
                        </span>
                        <span className="text-xs text-gray-500">{activity.date.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">€{activity.amount.toFixed(2)}</p>
                    <p
                      className={`text-xs capitalize ${
                        activity.status === "completed" || activity.status === "delivered"
                          ? "text-green-600"
                          : activity.status === "pending"
                            ? "text-yellow-600"
                            : "text-gray-600"
                      }`}
                    >
                      {activity.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
