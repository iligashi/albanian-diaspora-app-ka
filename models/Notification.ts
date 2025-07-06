import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["payment", "gift", "service", "system", "reminder"],
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel",
  },
  relatedModel: {
    type: String,
    enum: ["Payment", "Gift", "Service"],
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, read: 1 })

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
