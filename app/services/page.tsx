"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import { Wrench, Plus, Search, CheckCircle, Clock, AlertCircle, X, Star, Download } from "lucide-react"
import toast from "react-hot-toast"
import QRCode from "qrcode.react"
import { saveAs } from "file-saver"

interface ServiceBooking {
  _id: string
  category: string
  title: string
  description: string
  address: string
  scheduledDate: string
  timeSlot: {
    start: string
    end: string
  }
  price: number
  status: string
  paymentStatus: string
  contactPerson?: {
    name: string
    phone: string
  }
  notes?: string
  review?: {
    rating: number
    comment: string
  }
  createdAt: string
}

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (user) {
      fetchServices()
    }
  }, [user])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      } else {
        toast.error("Failed to load services")
      }
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")

      const serviceData = {
        ...data,
        price: Number.parseFloat(data.price),
        timeSlot: {
          start: data.timeStart,
          end: data.timeEnd,
        },
      }

      // Remove timeStart and timeEnd from the main object
      delete serviceData.timeStart
      delete serviceData.timeEnd

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serviceData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Service booking created successfully!")
        setServices([result.service, ...services])
        setShowServiceForm(false)
        reset()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create service booking")
      }
    } catch (error) {
      console.error("Error creating service:", error)
      toast.error("Failed to create service booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.contactPerson?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || service.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleSelectService = (serviceId: string) => {
    setSelectedServices((prevSelected) =>
      prevSelected.includes(serviceId) ? prevSelected.filter((id) => id !== serviceId) : [...prevSelected, serviceId],
    )
  }

  const handleSelectAllServices = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([])
    } else {
      setSelectedServices(filteredServices.map((service) => service._id))
    }
  }

  const handleBulkActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBulkAction(e.target.value)
  }

  const handleBulkActionSubmit = async () => {
    if (!bulkAction || selectedServices.length === 0) {
      toast.error("Please select an action and at least one service.")
      return
    }

    if (bulkAction === "delete") {
      if (window.confirm("Are you sure you want to delete selected services?")) {
        try {
          const token = localStorage.getItem("token")
          const response = await fetch("/api/services/bulk", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ serviceIds: selectedServices }),
          })

          if (response.ok) {
            toast.success("Selected services deleted successfully!")
            setServices((prevServices) => prevServices.filter((service) => !selectedServices.includes(service._id)))
            setSelectedServices([])
          } else {
            const error = await response.json()
            toast.error(error.message || "Failed to delete selected services")
          }
        } catch (error) {
          console.error("Error deleting services:", error)
          toast.error("Failed to delete selected services")
        }
      }
    } else {
      toast.error("Invalid bulk action.")
    }
  }

  const generateQRCode = (service: ServiceBooking) => {
    const qrCodeData = JSON.stringify({
      serviceId: service._id,
      title: service.title,
      category: service.category,
      scheduledDate: service.scheduledDate,
      timeSlot: service.timeSlot,
      price: service.price,
    })

    return qrCodeData
  }

  const downloadQRCode = (service: ServiceBooking) => {
    const qrCodeData = generateQRCode(service)
    const qrCodeSvg = document.getElementById(`qr-code-${service._id}`)?.querySelector("svg")

    if (qrCodeSvg) {
      qrCodeSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      const svgData = qrCodeSvg.outerHTML
      const preface = '<?xml version="1.0" standalone="no"?>\r\n'
      const svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" })
      saveAs(svgBlob, `service_${service._id}_qr.svg`)
    } else {
      toast.error("Could not generate QR code for download.")
    }
  }

  const serviceCategories = [
    { value: "cleaning", label: "Cleaning", basePrice: 25 },
    { value: "repairs", label: "Home Repairs", basePrice: 45 },
    { value: "internet_setup", label: "Internet Setup", basePrice: 35 },
    { value: "electrician", label: "Electrician", basePrice: 55 },
    { value: "plumbing", label: "Plumbing", basePrice: 50 },
    { value: "gardening", label: "Gardening", basePrice: 30 },
    { value: "other", label: "Other", basePrice: 40 },
  ]

  const timeSlots = [
    { start: "08:00", end: "10:00" },
    { start: "10:00", end: "12:00" },
    { start: "12:00", end: "14:00" },
    { start: "14:00", end: "16:00" },
    { start: "16:00", end: "18:00" },
    { start: "18:00", end: "20:00" },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Please log in</h2>
            <p className="text-gray-600">You need to be logged in to view services</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Center</h1>
              <p className="text-gray-600">Book home services for your family in Kosovo</p>
            </div>
            <button
              onClick={() => setShowServiceForm(true)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book Service
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
                    placeholder="Search services..."
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
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {filteredServices.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="select-all"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    checked={selectedServices.length === filteredServices.length}
                    onChange={handleSelectAllServices}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                    Select All
                  </label>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="sm:w-48">
                    <select
                      value={bulkAction}
                      onChange={handleBulkActionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                    >
                      <option value="">Select Action</option>
                      <option value="delete">Delete</option>
                    </select>
                  </div>
                  <button
                    onClick={handleBulkActionSubmit}
                    disabled={!bulkAction || selectedServices.length === 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Service Form Modal */}
          {showServiceForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Book a Service</h3>
                  <button onClick={() => setShowServiceForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Service Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Service Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service Category *</label>
                        <select
                          {...register("category", { required: "Category is required" })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Select category</option>
                          {serviceCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service Title *</label>
                        <input
                          {...register("title", { required: "Title is required" })}
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Brief title for the service"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Description *</label>
                      <textarea
                        {...register("description", { required: "Description is required" })}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Detailed description of what needs to be done..."
                      />
                      {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Service Address *</label>
                      <textarea
                        {...register("address", { required: "Address is required" })}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Full address where service will be performed"
                      />
                      {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Scheduling</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service Date *</label>
                        <input
                          {...register("scheduledDate", { required: "Date is required" })}
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                        {errors.scheduledDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.scheduledDate.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                        <select
                          {...register("timeStart", { required: "Start time is required" })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Select start time</option>
                          {timeSlots.map((slot) => (
                            <option key={slot.start} value={slot.start}>
                              {slot.start}
                            </option>
                          ))}
                        </select>
                        {errors.timeStart && <p className="mt-1 text-sm text-red-600">{errors.timeStart.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">End Time *</label>
                        <select
                          {...register("timeEnd", { required: "End time is required" })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Select end time</option>
                          {timeSlots.map((slot) => (
                            <option key={slot.end} value={slot.end}>
                              {slot.end}
                            </option>
                          ))}
                        </select>
                        {errors.timeEnd && <p className="mt-1 text-sm text-red-600">{errors.timeEnd.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Payment */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Contact & Payment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <input
                          {...register("contactPerson.name")}
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Contact person name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                        <input
                          {...register("contactPerson.phone")}
                          type="tel"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Contact phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Price (EUR) *</label>
                        <input
                          {...register("price", {
                            required: "Price is required",
                            min: { value: 0.01, message: "Price must be greater than 0" },
                          })}
                          type="number"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="0.00"
                        />
                        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                      <textarea
                        {...register("notes")}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Any special instructions or requirements..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowServiceForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Processing..." : "Book Service"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Services List */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <div key={service._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                              value={service._id}
                              checked={selectedServices.includes(service._id)}
                              onChange={() => handleSelectService(service._id)}
                            />
                            <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {service.category.replace("_", " ")}
                            </span>
                            <div className="flex items-center">
                              {getStatusIcon(service.status)}
                              <span
                                className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)} capitalize`}
                              >
                                {service.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => downloadQRCode(service)}
                              className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-gray-600">{service.description}</p>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(service.scheduledDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {service.timeSlot.start} - {service.timeSlot.end}
                          </div>
                          <div>
                            <span className="font-medium">Price:</span> €{service.price.toFixed(2)}
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Address:</span> {service.address}
                        </div>

                        {service.contactPerson && (
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Contact:</span> {service.contactPerson.name}
                            {service.contactPerson.phone && ` - ${service.contactPerson.phone}`}
                          </div>
                        )}

                        {service.notes && (
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Notes:</span> {service.notes}
                          </div>
                        )}

                        {service.review && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium text-gray-700">Review:</span>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < service.review!.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-600">({service.review.rating}/5)</span>
                            </div>
                            {service.review.comment && (
                              <p className="mt-1 text-sm text-gray-600">{service.review.comment}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-500">
                          Booked on {new Date(service.createdAt).toLocaleDateString()}
                        </div>
                        {service.paymentStatus && (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                service.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : service.paymentStatus === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              } capitalize`}
                            >
                              Payment: {service.paymentStatus}
                            </span>
                          </div>
                        )}
                        <div id={`qr-code-${service._id}`} className="mt-2">
                          <QRCode value={generateQRCode(service)} size={128} level="H" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by booking your first service."}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowServiceForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Book Service
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
