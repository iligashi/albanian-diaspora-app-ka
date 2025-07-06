import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "image", "file", "audio"],
    default: "text",
  },
  attachments: [
    {
      url: String,
      filename: String,
      type: String,
      size: Number,
    },
  ],
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ recipient: 1, read: 1 })

export default mongoose.models.Message || mongoose.model("Message", messageSchema)
