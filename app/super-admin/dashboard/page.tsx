"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, CreditCard, Shield, Activity, DollarSign, UserCheck, Plus } from "lucide-react"
import toast from "react-hot-toast"

interface DashboardStats {
  users: {
    total: number
    active: number
    premium: number
    newThisMonth: number
    growth: number
  }
  payments: {
    total: number
    completed: number
    totalRevenue: number
    monthlyRevenue: number
  }
  gifts: {
    total: number
    delivered: number
    pending: number
  }
  services: {
    total: number
    completed: number
    pending: number
  }
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/super-admin")
      return
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentActivity(data.recentActivity)
        setAnalytics(data.analytics)
      } else {
        toast.error("Failed to load dashboard data")
        if (response.status === 401) {
          router.push("/super-admin")
        }
      }
    } catch (error) {
      console.error("Dashboard error:", error)
      toast.error("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    router.push("/super-admin")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "users" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("features")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "features" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Features
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "analytics" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Analytics
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.users.total || 0}</p>
                    <p className="text-sm text-green-600">+{stats?.users.newThisMonth || 0} this month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      €{stats?.payments.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-sm text-green-600">
                      €{stats?.payments.monthlyRevenue?.toFixed(2) || "0.00"} this month
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Premium Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.users.premium || 0}</p>
                    <p className="text-sm text-gray-500">{stats?.users.active || 0} active users</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Activity className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.services.pending || 0}</p>
                    <p className="text-sm text-gray-500">{stats?.services.completed || 0} completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
                <div className="h-64 flex items-center justify-center">
                  {analytics?.revenueByMonth ? (
                    <div className="w-full">
                      <div className="flex items-end justify-between h-48 space-x-2">
                        {analytics.revenueByMonth.map((month: any, index: number) => (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div
                              className="bg-red-500 w-full rounded-t"
                              style={{
                                height: `${Math.max((month.revenue / Math.max(...analytics.revenueByMonth.map((m: any) => m.revenue))) * 100, 5)}%`,
                              }}
                            ></div>
                            <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                            <span className="text-xs font-medium">€{month.revenue.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No revenue data available</p>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity?.logs?.slice(0, 5).map((log: any) => (
                    <div key={log._id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Activity className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {log.adminId?.firstName} {log.adminId?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{log.action}</p>
                      </div>
                      <div className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Users and Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivity?.users?.map((user: any) => (
                    <div key={user._id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.isPremium && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Premium
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">View all</button>
                </div>
                <div className="space-y-4">
                  {recentActivity?.payments?.map((payment: any) => (
                    <div key={payment._id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <CreditCard className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {payment.user?.firstName} {payment.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.billType} - {payment.recipient.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">€{payment.amount.toFixed(2)}</p>
                        <p
                          className={`text-xs ${
                            payment.status === "completed"
                              ? "text-green-600"
                              : payment.status === "failed"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && <UserManagement />}
        {activeTab === "features" && <FeatureManagement />}
        {activeTab === "analytics" && <AdvancedAnalytics analytics={analytics} />}
      </main>
    </div>
  )
}

// User Management Component
function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [page, filter, searchTerm])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const params = new URLSearchParams({
        page: page.toString(),
        search: searchTerm,
        filter: filter,
      })

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Fetch users error:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: any) => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, updates }),
      })

      if (response.ok) {
        toast.success("User updated successfully")
        fetchUsers()
      } else {
        toast.error("Failed to update user")
      }
    } catch (error) {
      console.error("Update user error:", error)
      toast.error("Failed to update user")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Users</option>
            <option value="premium">Premium</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: any) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isPremium ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.isPremium ? "Premium" : "Regular"}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  €{user.totalSpent?.toFixed(2) || "0.00"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateUser(user._id, { isPremium: !user.isPremium })}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {user.isPremium ? "Remove Premium" : "Make Premium"}
                    </button>
                    <button
                      onClick={() => updateUser(user._id, { isActive: !user.isActive })}
                      className="text-red-600 hover:text-red-900"
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Feature Management Component
function FeatureManagement() {
  const [features, setFeatures] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFeature, setNewFeature] = useState({
    name: "",
    description: "",
    category: "other",
    isPremium: false,
    isEnabled: true,
  })

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("/api/admin/features", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFeatures(data.features)
      }
    } catch (error) {
      console.error("Fetch features error:", error)
    }
  }

  const createFeature = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("/api/admin/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFeature),
      })

      if (response.ok) {
        toast.success("Feature created successfully")
        setShowAddForm(false)
        setNewFeature({
          name: "",
          description: "",
          category: "other",
          isPremium: false,
          isEnabled: true,
        })
        fetchFeatures()
      } else {
        toast.error("Failed to create feature")
      }
    } catch (error) {
      console.error("Create feature error:", error)
      toast.error("Failed to create feature")
    }
  }

  const updateFeature = async (featureId: string, updates: any) => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("/api/admin/features", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featureId, updates }),
      })

      if (response.ok) {
        toast.success("Feature updated successfully")
        fetchFeatures()
      } else {
        toast.error("Failed to update feature")
      }
    } catch (error) {
      console.error("Update feature error:", error)
      toast.error("Failed to update feature")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Feature Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2 inline" />
          Add Feature
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Feature</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={newFeature.category}
                onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="payment">Payment</option>
                <option value="gift">Gift</option>
                <option value="service">Service</option>
                <option value="communication">Communication</option>
                <option value="analytics">Analytics</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newFeature.description}
                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newFeature.isPremium}
                  onChange={(e) => setNewFeature({ ...newFeature, isPremium: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Premium Feature</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newFeature.isEnabled}
                  onChange={(e) => setNewFeature({ ...newFeature, isEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enabled</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createFeature}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Create Feature
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {features.map((feature: any) => (
              <tr key={feature._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                    <div className="text-sm text-gray-500">{feature.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {feature.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feature.isEnabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {feature.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                    {feature.isPremium && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Premium
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(feature.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateFeature(feature._id, { isEnabled: !feature.isEnabled })}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {feature.isEnabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => updateFeature(feature._id, { isPremium: !feature.isPremium })}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {feature.isPremium ? "Make Free" : "Make Premium"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Advanced Analytics Component
function AdvancedAnalytics({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Month</h3>
          <div className="h-64">
            {analytics?.revenueByMonth ? (
              <div className="h-full flex items-end justify-between space-x-2">
                {analytics.revenueByMonth.map((month: any, index: number) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="text-xs font-medium mb-1">€{month.revenue.toFixed(0)}</div>
                    <div
                      className="bg-gradient-to-t from-red-500 to-red-400 w-full rounded-t"
                      style={{
                        height: `${Math.max((month.revenue / Math.max(...analytics.revenueByMonth.map((m: any) => m.revenue))) * 200, 10)}px`,
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No revenue data available</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-gray-900">~150ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium text-gray-900">247</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
