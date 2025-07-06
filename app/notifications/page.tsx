"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import { Bell, CheckCheck } from "lucide-react"
import toast from "react-hot-toast"

interface Notification {
  _id: string
  title: string
  message: string
  type: string
  read: boolean
  priority: string
  createdAt: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, filter])

  const fetchNotifications = async (pageNum = 1) => {
    try {
      const token = localStorage.getItem("token")
      const unreadParam = filter === "unread" ? "&unread=true" : ""
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20${unreadParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (pageNum === 1) {
          setNotifications(data.notifications)
        } else {
          setNotifications((prev) => [...prev, ...data.notifications])
        }
        setHasMore(data.pagination.current < data.pagination.pages)
        setPage(pageNum)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setNotifications(notifications.map((notif) => (notif._id === id ? { ...notif, read: true } : notif)))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      const unreadNotifications = notifications.filter((n) => !n.read)

      await Promise.all(
        unreadNotifications.map((notif) =>
          fetch(`/api/notifications/${notif._id}/read`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ),
      )

      setNotifications(notifications.map((notif) => ({ ...notif, read: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return "💳"
      case "gift":
        return "🎁"
      case "service":
        return "🔧"
      case "system":
        return "⚙️"
      case "reminder":
        return "⏰"
      default:
        return "📢"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-500"
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Please log in</h2>
            <p className="text-gray-600 dark:text-gray-400">You need to be logged in to view notifications</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-gray-600 dark:text-gray-400">Stay updated with your account activity</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
              </select>

              {/* Mark All Read */}
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm font-medium ${
                              !notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                notification.priority === "high"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                  : notification.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              }`}
                            >
                              {notification.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              notification.type === "payment"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                : notification.type === "gift"
                                  ? "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400"
                                  : notification.type === "service"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                            }`}
                          >
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {filter === "unread" ? "No unread notifications" : "You're all caught up!"}
                </p>
              </div>
            )}

            {/* Load More */}
            {hasMore && notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
