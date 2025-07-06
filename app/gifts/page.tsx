"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import { Plus, Search, Package, CheckCircle, Clock, AlertCircle, X, Heart, Copy, Download } from "lucide-react"
import toast from "react-hot-toast"
import QRCode from "qrcode.react"
import { saveAs } from "file-saver"

interface GiftItem {
  _id: string
  recipient: {
    name: string
    phone: string
    address: string
  }
  category: string
  item: {
    name: string
    description?: string
    price: number
  }
  quantity: number
  totalAmount: number
  message?: {
    text?: string
  }
  deliveryDate: string
  status: string
  trackingNumber?: string
  createdAt: string
}

export default function GiftsPage() {
  const { user } = useAuth()
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showGiftForm, setShowGiftForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedGifts, setSelectedGifts] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState("")
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm()

  const selectedCategory = watch("category")
  const itemPrice = watch("item.price")
  const quantity = watch("quantity", 1)

  useEffect(() => {
    if (user) {
      fetchGifts()
    }
  }, [user])

  const fetchGifts = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/gifts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGifts(data.gifts || [])
      } else {
        toast.error("Failed to load gifts")
      }
    } catch (error) {
      console.error("Error fetching gifts:", error)
      toast.error("Failed to load gifts")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")

      // Calculate total amount
      const totalAmount = (data.item.price || 0) * (data.quantity || 1)

      const giftData = {
        ...data,
        totalAmount,
        item: {
          ...data.item,
          price: Number.parseFloat(data.item.price),
        },
        quantity: Number.parseInt(data.quantity),
      }

      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(giftData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Gift order created successfully!")
        setGifts([result.gift, ...gifts])
        setShowGiftForm(false)
        reset()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create gift order")
      }
    } catch (error) {
      console.error("Error creating gift:", error)
      toast.error("Failed to create gift order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "out_for_delivery":
        return <Package className="h-5 w-5 text-blue-500" />
      case "preparing":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredGifts = gifts.filter((gift) => {
    const matchesSearch =
      gift.recipient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || gift.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const giftCategories = [
    {
      value: "flowers",
      label: "Flowers",
      items: [
        { name: "Red Roses Bouquet", price: 35.0, description: "Beautiful red roses arrangement" },
        { name: "Mixed Flowers", price: 28.0, description: "Colorful mixed flower bouquet" },
        { name: "White Lilies", price: 32.0, description: "Elegant white lilies" },
      ],
    },
    {
      value: "cakes",
      label: "Cakes",
      items: [
        { name: "Chocolate Birthday Cake", price: 45.0, description: "Rich chocolate cake with decorations" },
        { name: "Vanilla Wedding Cake", price: 65.0, description: "Multi-layer vanilla cake" },
        { name: "Fruit Cake", price: 38.0, description: "Fresh fruit topped cake" },
      ],
    },
    {
      value: "food",
      label: "Food & Treats",
      items: [
        { name: "Traditional Baklava", price: 25.0, description: "Homemade baklava selection" },
        { name: "Chocolate Box", price: 22.0, description: "Premium chocolate assortment" },
        { name: "Local Honey", price: 18.0, description: "Pure Kosovo mountain honey" },
      ],
    },
    {
      value: "electronics",
      label: "Electronics",
      items: [
        { name: "Smartphone", price: 299.0, description: "Latest model smartphone" },
        { name: "Tablet", price: 199.0, description: "10-inch tablet device" },
        { name: "Headphones", price: 89.0, description: "Wireless bluetooth headphones" },
      ],
    },
    {
      value: "clothing",
      label: "Clothing",
      items: [
        { name: "Traditional Vest", price: 85.0, description: "Handmade traditional Albanian vest" },
        { name: "Wool Sweater", price: 55.0, description: "Warm wool sweater" },
        { name: "Silk Scarf", price: 35.0, description: "Beautiful silk scarf" },
      ],
    },
    {
      value: "other",
      label: "Other",
      items: [{ name: "Custom Gift", price: 0, description: "Specify your own gift" }],
    },
  ]

  const selectedCategoryItems = giftCategories.find((cat) => cat.value === selectedCategory)?.items || []

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Please log in</h2>
            <p className="text-gray-600">You need to be logged in to view gifts</p>
          </div>
        </div>
      </div>
    )
  }

  const handleGiftSelect = (giftId: string) => {
    setSelectedGifts((prevSelected) =>
      prevSelected.includes(giftId) ? prevSelected.filter((id) => id !== giftId) : [...prevSelected, giftId],
    )
  }

  const handleSelectAllGifts = () => {
    if (selectedGifts.length === filteredGifts.length) {
      setSelectedGifts([])
    } else {
      setSelectedGifts(filteredGifts.map((gift) => gift._id))
    }
  }

  const handleBulkActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBulkAction(e.target.value)
  }

  const applyBulkAction = async () => {
    if (!bulkAction || selectedGifts.length === 0) {
      toast.error("Please select an action and at least one gift.")
      return
    }

    setIsBulkActionLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/gifts/bulk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          giftIds: selectedGifts,
          action: bulkAction,
        }),
      })

      if (response.ok) {
        toast.success(`Successfully applied action: ${bulkAction}`)
        fetchGifts() // Refresh gifts list
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to apply action: ${bulkAction}`)
      }
    } catch (error) {
      console.error("Error applying bulk action:", error)
      toast.error(`Failed to apply action: ${bulkAction}`)
    } finally {
      setIsBulkActionLoading(false)
      setSelectedGifts([])
      setBulkAction("")
    }
  }

  const downloadQRCode = (giftId: string, itemName: string) => {
    const canvas = document.getElementById(`qrcode-${giftId}`) as HTMLCanvasElement | null
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${itemName}-qrcode.png`)
        } else {
          toast.error("Failed to generate QR code.")
        }
      })
    } else {
      toast.error("QR code not found.")
    }
  }

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber)
    toast.success("Tracking number copied to clipboard!")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gift Center</h1>
              <p className="text-gray-600">Send thoughtful gifts to your loved ones in Kosovo</p>
            </div>
            <button
              onClick={() => setShowGiftForm(true)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Send Gift
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search gifts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gift Form Modal */}
          {showGiftForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Send a Gift</h3>
                  <button onClick={() => setShowGiftForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Recipient Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Recipient Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Recipient Name *</label>
                        <input
                          {...register("recipient.name", { required: "Recipient name is required" })}
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter recipient name"
                        />
                        {errors.recipient?.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.recipient.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                        <input
                          {...register("recipient.phone", { required: "Phone number is required" })}
                          type="tel"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter phone number"
                        />
                        {errors.recipient?.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.recipient.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Delivery Address *</label>
                      <textarea
                        {...register("recipient.address", { required: "Address is required" })}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter full delivery address"
                      />
                      {errors.recipient?.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.recipient.address.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Gift Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Gift Selection</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category *</label>
                        <select
                          {...register("category", { required: "Category is required" })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Select category</option>
                          {giftCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Item *</label>
                        <select
                          {...register("item.name", { required: "Item is required" })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          disabled={!selectedCategory}
                        >
                          <option value="">Select item</option>
                          {selectedCategoryItems.map((item) => (
                            <option key={item.name} value={item.name}>
                              {item.name} - €{item.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                        {errors.item?.name && <p className="mt-1 text-sm text-red-600">{errors.item.name.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price (EUR) *</label>
                        <input
                          {...register("item.price", {
                            required: "Price is required",
                            min: { value: 0.01, message: "Price must be greater than 0" },
                          })}
                          type="number"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="0.00"
                        />
                        {errors.item?.price && <p className="mt-1 text-sm text-red-600">{errors.item.price.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                        <input
                          {...register("quantity", {
                            required: "Quantity is required",
                            min: { value: 1, message: "Quantity must be at least 1" },
                          })}
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                        <div className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700">
                          €{((itemPrice || 0) * (quantity || 1)).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Item Description</label>
                      <textarea
                        {...register("item.description")}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Additional item details or customization"
                      />
                    </div>
                  </div>

                  {/* Message & Delivery */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Message & Delivery</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Personal Message</label>
                        <textarea
                          {...register("message.text")}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Write a personal message for the recipient..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Delivery Date *</label>
                        <input
                          {...register("deliveryDate", { required: "Delivery date is required" })}
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                        {errors.deliveryDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.deliveryDate.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowGiftForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Processing..." : "Send Gift"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Gifts List */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : filteredGifts.length > 0 ? (
              <div className="overflow-x-auto">
                {/* Bulk Actions */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      checked={selectedGifts.length === filteredGifts.length && filteredGifts.length > 0}
                      onChange={handleSelectAllGifts}
                      disabled={filteredGifts.length === 0}
                    />
                    <label className="text-sm font-medium text-gray-700">Select All</label>
                  </div>

                  <div className="flex items-center space-x-4">
                    <select
                      value={bulkAction}
                      onChange={handleBulkActionChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                    >
                      <option value="">Choose Action</option>
                      <option value="confirmed">Mark as Confirmed</option>
                      <option value="preparing">Mark as Preparing</option>
                      <option value="out_for_delivery">Mark as Out for Delivery</option>
                      <option value="delivered">Mark as Delivered</option>
                      <option value="cancelled">Mark as Cancelled</option>
                    </select>
                    <button
                      onClick={applyBulkAction}
                      disabled={isBulkActionLoading || !bulkAction || selectedGifts.length === 0}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBulkActionLoading ? "Applying..." : "Apply"}
                    </button>
                  </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gift
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGifts.map((gift) => (
                      <tr key={gift._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            value={gift._id}
                            checked={selectedGifts.includes(gift._id)}
                            onChange={() => handleGiftSelect(gift._id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{gift.recipient?.name}</div>
                            <div className="text-sm text-gray-500">{gift.recipient?.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{gift.item?.name}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {gift.category} • Qty: {gift.quantity}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{gift.totalAmount?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(gift.status)}
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(gift.status)} capitalize`}
                            >
                              {gift.status.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(gift.deliveryDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {gift.trackingNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {gift.trackingNumber && (
                              <button
                                onClick={() => copyTrackingNumber(gift.trackingNumber!)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            )}
                            <QRCode
                              id={`qrcode-${gift._id}`}
                              value={JSON.stringify(gift)}
                              size={64}
                              level="H"
                              className="hidden"
                            />
                            <button
                              onClick={() => downloadQRCode(gift._id, gift.item?.name)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No gifts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Start spreading joy by sending your first gift."}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowGiftForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Send Gift
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
