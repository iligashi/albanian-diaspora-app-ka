import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
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
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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
        name: {
          type: String,
          required: true,
        },
        relationship: {
          type: String,
          required: true,
          enum: ["parent", "spouse", "child", "sibling", "grandparent", "other"],
        },
        phone: String,
        email: String,
        address: String,
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
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.models.User || mongoose.model("User", userSchema)
