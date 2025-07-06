const mongoose = require("mongoose")

const serviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  category: {
    type: String,
    enum: ["cleaning", "repairs", "internet_setup", "electrician", "plumbing", "gardening", "other"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  timeSlot: {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ["EUR", "USD", "GBP"],
    default: "EUR",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  contactPerson: {
    name: String,
    phone: String,
  },
  notes: String,
  completedAt: Date,
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    createdAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for efficient queries
serviceSchema.index({ user: 1, createdAt: -1 })
serviceSchema.index({ vendor: 1, status: 1 })
serviceSchema.index({ category: 1 })
serviceSchema.index({ scheduledDate: 1 })

module.exports = mongoose.model("Service", serviceSchema)
