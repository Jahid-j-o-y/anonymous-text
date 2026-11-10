import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blockedSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    blockedIp: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
BlockSchema.index(
  { blockerId: 1, blockedSenderId: 1 },
  { unique: true, partialFilterExpression: { blockedSenderId: { $ne: null } } }
);

BlockSchema.index(
  { blockerId: 1, blockedIp: 1 },
  { unique: true, partialFilterExpression: { blockedIp: { $ne: null } } }
);

export const Block =
  mongoose.models.Block || mongoose.model("Block", BlockSchema);

export default Block;
