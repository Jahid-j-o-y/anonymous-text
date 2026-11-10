import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Message from "@/models/Message.js";
import Block from "@/models/Block.js";
import { getCurrentUser } from "@/lib/jwt.js";
import { replyMessageSchema } from "@/lib/validations.js";
import { containsOffensiveWords, OFFENSIVE_ERROR_MESSAGE } from "@/lib/badWords.js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit.js";

export async function POST(req, { params }) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (payload.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot send or reply to anonymous messages." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`reply:${payload.userId}:${ip}`, {
      limit: 20,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "You are replying too quickly. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = replyMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    // Check offensive words
    if (containsOffensiveWords(content)) {
      return NextResponse.json(
        { error: OFFENSIVE_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    await connectDB();

    const originalMessage = await Message.findById(id);

    if (!originalMessage || originalMessage.isDeleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Authorization: User must be the receiver of this original message
    if (originalMessage.receiverId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: "You are not authorized to reply to this message" },
        { status: 403 }
      );
    }

    if (!originalMessage.senderId) {
      return NextResponse.json(
        { error: "Cannot reply: This message was sent by an anonymous guest visitor without an account." },
        { status: 400 }
      );
    }

    // Check if the original sender has blocked this user
    const isBlocked = await Block.findOne({
      blockerId: originalMessage.senderId,
      blockedSenderId: payload.userId,
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "You cannot reply to this user because you have been blocked." },
        { status: 403 }
      );
    }

    // Create reply message
    await Message.create({
      senderId: payload.userId,
      receiverId: originalMessage.senderId,
      parentId: originalMessage._id,
      content,
      isRead: false,
      isDeleted: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Reply sent anonymously!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reply error:", error);
    return NextResponse.json(
      { error: "Failed to send anonymous reply" },
      { status: 500 }
    );
  }
}

