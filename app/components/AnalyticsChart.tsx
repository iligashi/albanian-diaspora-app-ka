"use client"

import { useState, useEffect } from "react"
import { BarChart3, PieChart, TrendingUp, Download } from "lucide-react"

interface AnalyticsData {
  spendingByCategory: Array<{ _id: string; total: number; count: number }>
  monthlySpending: Array<{ _id: string; total: number; count: number }>
  giftsByCategory: Array<{ _id: string; total: number; count: number }>
  servicesByCategory: Array<{ _id: string; total: number; count: number }>
  activityTrends: {
    payments: number
    gifts: number
    services: number
  }
}

export default function AnalyticsChart() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const [activeTab, setActiveTab] = useState("spending")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/analytics?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/export?format=csv", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `diaspora-analytics-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  const tabs = [
    { id: "spending", label: "Spending", icon: BarChart3 },
    { id: "gifts", label: "Gifts", icon: PieChart },
    { id: "services", label: "Services", icon: TrendingUp },
  ]

  const renderSpendingChart = () => {
    const maxAmount = Math.max(...data.spendingByCategory.map((item) => item.total))

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Spending by Category</h3>
        {data.spendingByCategory.map((item) => (
          <div key={item._id} className="flex items-center space-x-4">
            <div className="w-20 text-sm text-gray-600 capitalize">{item._id}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(item.total / maxAmount) * 100}%` }}
              ></div>
            </div>
            <div className="w-20 text-sm font-medium text-gray-900">€{item.total.toFixed(2)}</div>
            <div className="w-16 text-sm text-gray-500">{item.count} bills</div>
          </div>
        ))}
      </div>
    )
  }

  const renderGiftsChart = () => {
    const maxCount = Math.max(...data.giftsByCategory.map((item) => item.count))

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Gifts by Category</h3>
        {data.giftsByCategory.map((item) => (
          <div key={item._id} className="flex items-center space-x-4">
            <div className="w-20 text-sm text-gray-600 capitalize">{item._id}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              ></div>
            </div>
            <div className="w-20 text-sm font-medium text-gray-900">€{item.total.toFixed(2)}</div>
            <div className="w-16 text-sm text-gray-500">{item.count} gifts</div>
          </div>
        ))}
      </div>
    )
  }

  const renderServicesChart = () => {
    const maxCount = Math.max(...data.servicesByCategory.map((item) => item.count))

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Services by Category</h3>
        {data.servicesByCategory.map((item) => (
          <div key={item._id} className="flex items-center space-x-4">
            <div className="w-24 text-sm text-gray-600 capitalize">{item._id.replace("_", " ")}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              ></div>
            </div>
            <div className="w-20 text-sm font-medium text-gray-900">€{item.total.toFixed(2)}</div>
            <div className="w-20 text-sm text-gray-500">{item.count} services</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-red-500 focus:border-red-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={exportData}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payments</p>
                <p className="text-2xl font-bold text-gray-900">{data.activityTrends.payments}</p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <PieChart className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gifts</p>
                <p className="text-2xl font-bold text-gray-900">{data.activityTrends.gifts}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Services</p>
                <p className="text-2xl font-bold text-gray-900">{data.activityTrends.services}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {activeTab === "spending" && renderSpendingChart()}
        {activeTab === "gifts" && renderGiftsChart()}
        {activeTab === "services" && renderServicesChart()}
      </div>
    </div>
  )
}
