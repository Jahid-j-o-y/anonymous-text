import mongoose from "mongoose";

const ChatQueueSchema = new mongoose.Schema(
  {
    participantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    alias: {
      type: String,
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "matched"],
      default: "waiting",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 120, // 2 minutes TTL
    },
  },
  { timestamps: true }
);

export const ChatQueue =
  mongoose.models.ChatQueue || mongoose.model("ChatQueue", ChatQueueSchema);

export default ChatQueue;

