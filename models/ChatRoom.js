import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    senderAlias: {
      type: String,
      required: true,
    },
    participantId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ParticipantSchema = new mongoose.Schema(
  {
    participantId: {
      type: String,
      required: true,
    },
    alias: {
      type: String,
      required: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ChatRoomSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["waiting", "active", "ended"],
      default: "waiting",
      index: true,
    },
    participants: [ParticipantSchema],
    messages: [ChatMessageSchema],
    endedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Privacy TTL Index: Automatically purge chat rooms 2 hours after last update
ChatRoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7200 });

export const ChatRoom =
  mongoose.models.ChatRoom || mongoose.model("ChatRoom", ChatRoomSchema);

export default ChatRoom;

