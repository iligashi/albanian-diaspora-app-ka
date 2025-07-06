"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Gift, Heart, DollarSign, Calendar, User, MapPin } from "lucide-react"
import toast from "react-hot-toast"

interface GiftItem {
  _id: string
  title: string
  description: string
  price: number
  category: string
  recipientName: string
  recipientAddress: string
  deliveryDate: string
  status: "pending" | "processing" | "shipped" | "delivered"
  createdAt: string
  senderName: string
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    recipientName: "",
    recipientAddress: "",
    deliveryDate: "",
  })

  useEffect(() => {
    fetchGifts()
  }, [])

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
        toast.error("Failed to fetch gifts")
      }
    } catch (error) {
      console.error("Error fetching gifts:", error)
      toast.error("Error loading gifts")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
        }),
      })

      if (response.ok) {
        toast.success("Gift created successfully!")
        setShowCreateForm(false)
        setFormData({
          title: "",
          description: "",
          price: "",
          category: "",
          recipientName: "",
          recipientAddress: "",
          deliveryDate: "",
        })
        fetchGifts()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create gift")
      }
    } catch (error) {
      console.error("Error creating gift:", error)
      toast.error("Error creating gift")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-8 w-8 text-red-600" />
            Gift Management
          </h1>
          <p className="text-gray-600 mt-2">Send gifts to your loved ones in Kosovo</p>
        </div>

        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Heart className="h-4 w-4 mr-2" />
              Send Gift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send a Gift</DialogTitle>
              <DialogDescription>Create a new gift to send to your family or friends in Kosovo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Gift Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Birthday Gift"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (EUR)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="food">Food & Groceries</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="toys">Toys</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the gift..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recipientAddress">Delivery Address</Label>
                <Textarea
                  id="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                  placeholder="Full address in Kosovo"
                  rows={2}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Create Gift
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {gifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No gifts yet</h3>
            <p className="text-gray-600 text-center mb-4">Start sending gifts to your loved ones in Kosovo</p>
            <Button onClick={() => setShowCreateForm(true)} className="bg-red-600 hover:bg-red-700">
              Send Your First Gift
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => (
            <Card key={gift._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{gift.title}</CardTitle>
                  <Badge className={getStatusColor(gift.status)}>{gift.status}</Badge>
                </div>
                <CardDescription>{gift.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">€{gift.price}</span>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{gift.category}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>To: {gift.recipientName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{gift.recipientAddress}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Delivery: {new Date(gift.deliveryDate).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Created: {new Date(gift.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
