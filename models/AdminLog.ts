import mongoose from "mongoose"

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "CREATE_FEATURE",
        "UPDATE_FEATURE",
        "DELETE_FEATURE",
        "VIEW_ANALYTICS",
        "EXPORT_DATA",
        "SYSTEM_CONFIG",
      ],
    },
    targetType: {
      type: String,
      enum: ["user", "payment", "gift", "service", "feature", "system"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.AdminLog || mongoose.model("AdminLog", adminLogSchema)
