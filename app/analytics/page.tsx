"use client"

import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import AnalyticsChart from "../components/AnalyticsChart"

export default function AnalyticsPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Please log in</h2>
            <p className="text-gray-600 dark:text-gray-400">You need to be logged in to view analytics</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Insights into your spending patterns and activity</p>
          </div>

          {/* Analytics Chart */}
          <AnalyticsChart />
        </div>
      </main>
    </div>
  )
}
