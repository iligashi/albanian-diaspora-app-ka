import mongoose from "mongoose"
import bcrypt from "bcryptjs"

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
    enum: ["user", "admin", "vendor", "super_admin"],
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
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      name: String,
      relationship: String,
      phone: String,
      address: String,
      email: String,
      avatar: String,
      isRegistered: {
        type: Boolean,
        default: false,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
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
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiresAt: Date,
  avatar: String,
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Update updatedAt on save
userSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.models.User || mongoose.model("User", userSchema)
