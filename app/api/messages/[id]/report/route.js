import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Message from "@/models/Message.js";
import Report from "@/models/Report.js";
import Block from "@/models/Block.js";
import { getCurrentUser } from "@/lib/jwt.js";
import { reportMessageSchema } from "@/lib/validations.js";

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

    const body = await req.json();
    const parsed = reportMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { reason, alsoBlockSender } = parsed.data;

    await connectDB();

    const message = await Message.findById(id);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify user owns the message
    if (message.receiverId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: "You are not authorized to report this message" },
        { status: 403 }
      );
    }

    // Create Report
    await Report.create({
      messageId: message._id,
      reporterId: payload.userId,
      reason,
      status: "pending",
    });

    // If alsoBlockSender is selected, block the sender
    if (alsoBlockSender) {
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
    }

    return NextResponse.json({
      success: true,
      message: alsoBlockSender
        ? "Report submitted and sender has been blocked."
        : "Report submitted successfully.",
    });
  } catch (error) {
    console.error("Report message error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}

