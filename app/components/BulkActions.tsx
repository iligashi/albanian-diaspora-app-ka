"use client"

import { useState } from "react"
import { CheckSquare, Square, Trash2, Edit, Download, X } from "lucide-react"
import toast from "react-hot-toast"

interface BulkActionsProps {
  items: any[]
  selectedItems: string[]
  onSelectionChange: (selected: string[]) => void
  type: "payments" | "gifts" | "services"
  onRefresh: () => void
}

export default function BulkActions({ items, selectedItems, onSelectionChange, type, onRefresh }: BulkActionsProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateData, setUpdateData] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const isAllSelected = items.length > 0 && selectedItems.length === items.length
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < items.length

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map((item) => item._id))
    }
  }

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      onSelectionChange(selectedItems.filter((itemId) => itemId !== id))
    } else {
      onSelectionChange([...selectedItems, id])
    }
  }

  const performBulkAction = async (action: string, data?: any) => {
    if (selectedItems.length === 0) {
      toast.error("No items selected")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          type,
          ids: selectedItems,
          updateData: data,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        if (action === "export") {
          // Handle export
          const blob = new Blob([JSON.stringify(result.items, null, 2)], {
            type: "application/json",
          })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          toast.success("Data exported successfully!")
        } else {
          toast.success(result.message)
          onRefresh()
          onSelectionChange([])
        }
      } else {
        const error = await response.json()
        toast.error(error.message || "Operation failed")
      }
    } catch (error) {
      console.error("Bulk action error:", error)
      toast.error("Operation failed")
    } finally {
      setLoading(false)
      setShowUpdateModal(false)
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      performBulkAction("delete")
    }
  }

  const handleBulkUpdate = () => {
    performBulkAction("update", updateData)
  }

  const getUpdateFields = () => {
    switch (type) {
      case "payments":
        return [
          { key: "status", label: "Status", type: "select", options: ["pending", "processing", "completed", "failed"] },
        ]
      case "gifts":
        return [
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
          },
        ]
      case "services":
        return [
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["pending", "accepted", "in_progress", "completed", "cancelled"],
          },
          { key: "paymentStatus", label: "Payment Status", type: "select", options: ["pending", "paid", "failed"] },
        ]
      default:
        return []
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Select All Checkbox */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {isAllSelected ? (
              <CheckSquare className="h-5 w-5 text-blue-600" />
            ) : isPartiallySelected ? (
              <div className="h-5 w-5 border-2 border-blue-600 bg-blue-600 rounded flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded"></div>
              </div>
            ) : (
              <Square className="h-5 w-5" />
            )}
            <span>{selectedItems.length > 0 ? `${selectedItems.length} selected` : "Select all"}</span>
          </button>

          {/* Individual Item Checkboxes */}
          <div className="flex flex-wrap gap-2">
            {items.slice(0, 5).map((item) => (
              <button
                key={item._id}
                onClick={() => toggleSelectItem(item._id)}
                className={`px-2 py-1 text-xs rounded border ${
                  selectedItems.includes(item._id)
                    ? "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400"
                    : "bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                }`}
              >
                {selectedItems.includes(item._id) ? (
                  <CheckSquare className="h-3 w-3" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
              </button>
            ))}
            {items.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">+{items.length - 5} more</span>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUpdateModal(true)}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Edit className="h-4 w-4 mr-1" />
              Update
            </button>

            <button
              onClick={() => performBulkAction("export")}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Update {selectedItems.length} Items</h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {getUpdateFields().map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={updateData[field.key] || ""}
                      onChange={(e) => setUpdateData({ ...updateData, [field.key]: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1).replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={updateData[field.key] || ""}
                      onChange={(e) => setUpdateData({ ...updateData, [field.key]: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={loading || Object.keys(updateData).length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
