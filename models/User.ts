import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  phone: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "vendor"],
    default: "user",
  },
  address: {
    street: String,
    city: String,
    country: String,
    zipCode: String,
  },
  kosovoAddress: {
    street: String,
    city: String,
    zipCode: String,
  },
  familyMembers: [
    {
      name: String,
      relationship: String,
      phone: String,
      address: String,
    },
  ],
  preferredCurrency: {
    type: String,
    enum: ["EUR", "USD", "GBP"],
    default: "EUR",
  },
  language: {
    type: String,
    enum: ["en", "sq"],
    default: "en",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.User || mongoose.model("User", userSchema)
