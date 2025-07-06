"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import { CreditCard, Plus, CheckCircle, Clock, AlertCircle, X } from "lucide-react"
import toast from "react-hot-toast"
import QRCodeGenerator from "../components/QRCodeGenerator"
import BulkActions from "../components/BulkActions"
import SearchAndFilter from "../components/SearchAndFilter"

interface Payment {
  _id: string
  recipient: {
    name: string
    phone?: string
    address: string
  }
  billType: string
  amount: number
  currency: string
  status: string
  transactionId?: string
  createdAt: string
  description?: string
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [user])

  useEffect(() => {
    setFilteredPayments(payments)
  }, [payments])

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      } else {
        toast.error("Failed to load payments")
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Payment initiated successfully!")
        setPayments([result.payment, ...payments])
        setShowPaymentForm(false)
        reset()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create payment")
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      toast.error("Failed to create payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateQRCode = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowQRGenerator(true)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    applyFilters(term, filterStatus)
  }

  const handleFilter = (filters: any) => {
    applyFilters(searchTerm, filters.status || "all", filters)
  }

  const applyFilters = (search: string, status: string, additionalFilters?: any) => {
    const filtered = payments.filter((payment) => {
      const matchesSearch =
        payment.recipient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        payment.billType?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === "all" || payment.status === status

      let matchesAdditional = true
      if (additionalFilters) {
        if (additionalFilters.startDate && additionalFilters.endDate) {
          const paymentDate = new Date(payment.createdAt)
          const startDate = new Date(additionalFilters.startDate)
          const endDate = new Date(additionalFilters.endDate)
          matchesAdditional = paymentDate >= startDate && paymentDate <= endDate
        }
        if (additionalFilters.minPrice || additionalFilters.maxPrice) {
          const min = Number.parseFloat(additionalFilters.minPrice) || 0
          const max = Number.parseFloat(additionalFilters.maxPrice) || Number.POSITIVE_INFINITY
          matchesAdditional = matchesAdditional && payment.amount >= min && payment.amount <= max
        }
      }

      return matchesSearch && matchesStatus && matchesAdditional
    })
    setFilteredPayments(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const billTypes = [
    { value: "electricity", label: "Electricity" },
    { value: "water", label: "Water" },
    { value: "rent", label: "Rent" },
    { value: "internet", label: "Internet" },
    { value: "phone", label: "Phone" },
    { value: "gas", label: "Gas" },
    { value: "other", label: "Other" },
  ]

  const paymentMethods = [
    { value: "card", label: "Credit/Debit Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "paypal", label: "PayPal" },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Please log in</h2>
            <p className="text-gray-600">You need to be logged in to view payments</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Payment Center</h1>
              <p className="text-gray-600">Pay bills and manage payments for your family in Kosovo</p>
            </div>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Payment
            </button>
          </div>

          {/* Filters */}
          <SearchAndFilter
            onSearch={handleSearch}
            onFilter={handleFilter}
            filterOptions={{
              statuses: ["pending", "processing", "completed", "failed"],
              dateRange: true,
              priceRange: true,
            }}
            placeholder="Search payments..."
          />

          <BulkActions
            items={filteredPayments}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            type="payments"
            onRefresh={fetchPayments}
          />

          {/* Payment Form Modal */}
          {showPaymentForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New Payment</h3>
                  <button onClick={() => setShowPaymentForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        {...register("recipient.phone")}
                        type="tel"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address *</label>
                    <textarea
                      {...register("recipient.address", { required: "Address is required" })}
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter full address"
                    />
                    {errors.recipient?.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.recipient.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bill Type *</label>
                      <select
                        {...register("billType", { required: "Bill type is required" })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select bill type</option>
                        {billTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.billType && <p className="mt-1 text-sm text-red-600">{errors.billType.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (EUR) *</label>
                      <input
                        {...register("amount", {
                          required: "Amount is required",
                          min: { value: 0.01, message: "Amount must be greater than 0" },
                        })}
                        type="number"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="0.00"
                      />
                      {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                    <select
                      {...register("paymentMethod", { required: "Payment method is required" })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    {errors.paymentMethod && (
                      <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      {...register("description")}
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Additional notes or description"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Processing..." : "Create Payment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Payments List */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payment.recipient?.name}</div>
                            <div className="text-sm text-gray-500">{payment.recipient?.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {payment.billType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{payment.amount?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(payment.status)}
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)} capitalize`}
                            >
                              {payment.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {payment.transactionId || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => generateQRCode(payment)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            QR Code
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating your first payment."}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Payment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {showQRGenerator && selectedPayment && (
            <QRCodeGenerator type="payment" data={selectedPayment} onClose={() => setShowQRGenerator(false)} />
          )}
        </div>
      </main>
    </div>
  )
}
