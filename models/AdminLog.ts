import mongoose from "mongoose"

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetType: {
    type: String,
    enum: ["user", "payment", "gift", "service", "system", "feature"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for better query performance
adminLogSchema.index({ adminId: 1, createdAt: -1 })
adminLogSchema.index({ action: 1 })
adminLogSchema.index({ targetType: 1 })

export default mongoose.models.AdminLog || mongoose.model("AdminLog", adminLogSchema)
