import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Message from "@/models/Message.js";
import Block from "@/models/Block.js";
import { getCurrentUser } from "@/lib/jwt.js";

export async function POST(req, { params }) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findById(id);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify user owns the message
    if (message.receiverId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    // Upsert the block record (by user ID if registered, or by IP if guest)
    if (message.senderId) {
      await Block.updateOne(
        {
          blockerId: payload.userId,
          blockedSenderId: message.senderId,
        },
        {
          $setOnInsert: {
            blockerId: payload.userId,
            blockedSenderId: message.senderId,
          },
        },
        { upsert: true }
      );
    } else if (message.senderIp) {
      await Block.updateOne(
        {
          blockerId: payload.userId,
          blockedIp: message.senderIp,
        },
        {
          $setOnInsert: {
            blockerId: payload.userId,
            blockedIp: message.senderIp,
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sender has been blocked. They can no longer send you messages.",
    });
  } catch (error) {
    console.error("Block sender error:", error);
    return NextResponse.json(
      { error: "Failed to block sender" },
      { status: 500 }
    );
  }
}

