"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import { User, Save, Eye, EyeOff, Plus, X, Edit, MessageCircle, Send, CreditCard } from "lucide-react"
import toast from "react-hot-toast"

interface FamilyMember {
  _id: string
  name: string
  relationship: string
  phone: string
  address: string
  email?: string
  isRegistered: boolean
  userId?: string
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false)
  const [showSendGiftModal, setShowSendGiftModal] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm()

  const {
    register: registerFamily,
    handleSubmit: handleFamilySubmit,
    reset: resetFamily,
    formState: { errors: familyErrors },
  } = useForm()

  const {
    register: registerMoney,
    handleSubmit: handleMoneySubmit,
    reset: resetMoney,
    formState: { errors: moneyErrors },
  } = useForm()

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          country: user.address?.country || "",
          zipCode: user.address?.zipCode || "",
        },
        kosovoAddress: {
          street: user.kosovoAddress?.street || "",
          city: user.kosovoAddress?.city || "",
          zipCode: user.kosovoAddress?.zipCode || "",
        },
        preferredCurrency: user.preferredCurrency || "EUR",
        language: user.language || "en",
      })
      setFamilyMembers(user.familyMembers || [])
    }
  }, [user, reset])

  const onSubmitProfile = async (data: any) => {
    try {
      await updateProfile(data)
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    }
  }

  const onSubmitPassword = async (data: any) => {
    try {
      // In a real app, this would call a password change API
      toast.success("Password updated successfully!")
      setShowPasswordForm(false)
      resetPassword()
    } catch (error) {
      toast.error("Failed to update password")
    }
  }

  const onSubmitFamily = async (data: any) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/family", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setFamilyMembers([...familyMembers, result.familyMember])
        setShowFamilyForm(false)
        resetFamily()
        toast.success("Family member added successfully!")
      } else {
        toast.error("Failed to add family member")
      }
    } catch (error) {
      console.error("Add family member error:", error)
      toast.error("Failed to add family member")
    }
  }

  const removeFamilyMember = async (memberId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/family?id=${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setFamilyMembers(result.familyMembers)
        toast.success("Family member removed")
      } else {
        toast.error("Failed to remove family member")
      }
    } catch (error) {
      console.error("Remove family member error:", error)
      toast.error("Failed to remove family member")
    }
  }

  const handleSendMoney = async (data: any) => {
    if (!selectedMember) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/family/${selectedMember._id}/send-money`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Money transfer initiated successfully!")
        setShowSendMoneyModal(false)
        resetMoney()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to send money")
      }
    } catch (error) {
      console.error("Send money error:", error)
      toast.error("Failed to send money")
    }
  }

  const handleSendGift = async (data: any) => {
    if (!selectedMember) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/family/${selectedMember._id}/send-gift`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Gift created successfully!")
        setShowSendGiftModal(false)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create gift")
      }
    } catch (error) {
      console.error("Send gift error:", error)
      toast.error("Failed to create gift")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Please log in</h2>
            <p className="text-gray-600">You need to be logged in to view your profile</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {user.role}
                    </span>
                    {user.isPremium && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Change Password
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmitProfile)} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    {...register("firstName", { required: "First name is required" })}
                    type="text"
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    {...register("lastName", { required: "Last name is required" })}
                    type="text"
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    {...register("email")}
                    type="email"
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    {...register("phone")}
                    type="tel"
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Current Address */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Current Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      {...register("address.street")}
                      type="text"
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      {...register("address.city")}
                      type="text"
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      {...register("address.country")}
                      type="text"
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                      {...register("address.zipCode")}
                      type="text"
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Kosovo Address */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Kosovo Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      {...register("kosovoAddress.street")}
                      type="text"
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      {...register("kosovoAddress.city")}
                      type="text"
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                      {...register("kosovoAddress.zipCode")}
                      type="text"
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Currency</label>
                    <select
                      {...register("preferredCurrency")}
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select
                      {...register("language")}
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="en">English</option>
                      <option value="sq">Albanian</option>
                    </select>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Family Members */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Family Members</h2>
              <button
                onClick={() => setShowFamilyForm(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </button>
            </div>
            <div className="p-6">
              {familyMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {familyMembers.map((member) => (
                    <div key={member._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                          <p className="text-sm text-gray-500">{member.phone}</p>
                          <p className="text-sm text-gray-500">{member.address}</p>
                          {member.email && <p className="text-sm text-gray-500">{member.email}</p>}
                          {member.isRegistered && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                              Registered User
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFamilyMember(member._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member)
                            setShowChatModal(true)
                          }}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member)
                            setShowSendMoneyModal(true)
                          }}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Send Money
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member)
                            setShowSendGiftModal(true)
                          }}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send Gift
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No family members added</h3>
                  <p className="mt-1 text-sm text-gray-500">Add family members to manage their needs more easily.</p>
                </div>
              )}
            </div>
          </div>

          {/* Password Change Modal */}
          {showPasswordForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                  <button onClick={() => setShowPasswordForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <div className="mt-1 relative">
                      <input
                        {...registerPassword("currentPassword", { required: "Current password is required" })}
                        type={showPassword ? "text" : "password"}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="mt-1 relative">
                      <input
                        {...registerPassword("newPassword", {
                          required: "New password is required",
                          minLength: { value: 6, message: "Password must be at least 6 characters" },
                        })}
                        type={showNewPassword ? "text" : "password"}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Family Member Form Modal */}
          {showFamilyForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add Family Member</h3>
                  <button onClick={() => setShowFamilyForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleFamilySubmit(onSubmitFamily)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      {...registerFamily("name", { required: "Name is required" })}
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Full name"
                    />
                    {familyErrors.name && <p className="mt-1 text-sm text-red-600">{familyErrors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relationship *</label>
                    <select
                      {...registerFamily("relationship", { required: "Relationship is required" })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select relationship</option>
                      <option value="parent">Parent</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="grandparent">Grandparent</option>
                      <option value="other">Other</option>
                    </select>
                    {familyErrors.relationship && (
                      <p className="mt-1 text-sm text-red-600">{familyErrors.relationship.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      {...registerFamily("phone")}
                      type="tel"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                    <input
                      {...registerFamily("email")}
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      {...registerFamily("address")}
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Full address"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowFamilyForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Send Money Modal */}
          {showSendMoneyModal && selectedMember && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Send Money to {selectedMember.name}</h3>
                  <button onClick={() => setShowSendMoneyModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleMoneySubmit(handleSendMoney)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      {...registerMoney("amount", { required: "Amount is required" })}
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter amount"
                    />
                    {moneyErrors.amount && <p className="mt-1 text-sm text-red-600">{moneyErrors.amount.message}</p>}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSendMoneyModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Send Money
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Send Gift Modal */}
          {showSendGiftModal && selectedMember && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Send Gift to {selectedMember.name}</h3>
                  <button onClick={() => setShowSendGiftModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleSendGift)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gift Description</label>
                    <textarea
                      {...register("giftDescription", { required: "Gift description is required" })}
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter gift description"
                    />
                    {errors.giftDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.giftDescription.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSendGiftModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Send Gift
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Chat Modal */}
          {showChatModal && selectedMember && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Chat with {selectedMember.name}</h3>
                  <button onClick={() => setShowChatModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      {...register("message", { required: "Message is required" })}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your message"
                    />
                    {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowChatModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
