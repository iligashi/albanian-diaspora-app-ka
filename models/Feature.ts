import mongoose from "mongoose"

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  isEnabled: {
    type: Boolean,
    default: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    enum: ["payment", "gift", "service", "communication", "analytics", "other"],
    required: true,
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  version: {
    type: String,
    default: "1.0.0",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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

featureSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Feature || mongoose.model("Feature", featureSchema)
