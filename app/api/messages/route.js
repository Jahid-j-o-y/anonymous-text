import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import Message from "@/models/Message.js";
import Block from "@/models/Block.js";
import { getCurrentUser } from "@/lib/jwt.js";
import { sendMessageSchema } from "@/lib/validations.js";
import { containsOffensiveWords, OFFENSIVE_ERROR_MESSAGE } from "@/lib/badWords.js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit.js";

// GET: Inbox for current user
export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch messages addressed to this user, not deleted, newest first.
    // Explicitly omit senderId from projection and map to clean DTOs.
    const messages = await Message.find({
      receiverId: payload.userId,
      isDeleted: false,
    })
      .select("_id content isRead parentId createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const dtos = messages.map((m) => ({
      id: m._id.toString(),
      content: m.content,
      isRead: Boolean(m.isRead),
      parentId: m.parentId ? m.parentId.toString() : null,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      messages: dtos,
      unreadCount: dtos.filter((m) => !m.isRead).length,
    });
  } catch (error) {
    console.error("Inbox GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inbox messages" },
      { status: 500 }
    );
  }
}

// POST: Send an anonymous message
export async function POST(req) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Admins cannot send messages
    if (payload.role === "admin") {
      return NextResponse.json(
        { error: "Admins are not permitted to send anonymous messages." },
        { status: 403 }
      );
    }

    // Rate limiting: 20 messages per minute per IP / User
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`send:${payload.userId}:${ip}`, {
      limit: 20,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "You are sending messages too quickly. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { recipientUsername, content } = parsed.data;

    // Check offensive words filter
    if (containsOffensiveWords(content)) {
      return NextResponse.json(
        { error: OFFENSIVE_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if recipient exists
    const recipient = await User.findOne({
      username: recipientUsername.toLowerCase(),
    });

    if (!recipient) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (recipient.isBlocked) {
      return NextResponse.json(
        { error: "User is currently unavailable." },
        { status: 400 }
      );
    }

    // Prevent sending message to yourself
    if (recipient._id.toString() === payload.userId) {
      return NextResponse.json(
        { error: "You cannot send an anonymous message to yourself." },
        { status: 400 }
      );
    }

    // Check if recipient has blocked sender
    const isBlockedByRecipient = await Block.findOne({
      blockerId: recipient._id,
      blockedSenderId: payload.userId,
    });

    if (isBlockedByRecipient) {
      return NextResponse.json(
        { error: "Message could not be delivered. You have been blocked by this user." },
        { status: 403 }
      );
    }

    // Create the message
    await Message.create({
      senderId: payload.userId,
      receiverId: recipient._id,
      content,
      isRead: false,
      isDeleted: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Message sent anonymously!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send anonymous message" },
      { status: 500 }
    );
  }
}

