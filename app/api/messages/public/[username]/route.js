import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import Message from "@/models/Message.js";
import Block from "@/models/Block.js";
import { getCurrentUser } from "@/lib/jwt.js";
import { containsOffensiveWords, OFFENSIVE_ERROR_MESSAGE } from "@/lib/badWords.js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit.js";
import { z } from "zod";

const publicMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content cannot be empty")
    .max(500, "Message cannot exceed 500 characters"),
});

// GET: public user profile card info for /u/[username]
export async function GET(req, { params }) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    }).select("fullName username isBlocked");

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        fullName: user.fullName,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Public profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// POST: send public anonymous message (NGL style - no login required!)
export async function POST(req, { params }) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const ip = getClientIp(req);

    // Rate-limiting for guest public send (15 messages/minute per IP)
    const rateCheck = checkRateLimit(`public_send:${ip}`, {
      limit: 15,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "You are sending messages too fast. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = publicMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid message format" },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    // Check offensive words filter
    if (containsOffensiveWords(content)) {
      return NextResponse.json(
        { error: OFFENSIVE_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    await connectDB();

    const recipient = await User.findOne({
      username: username.toLowerCase().trim(),
    });

    if (!recipient || recipient.isBlocked) {
      return NextResponse.json(
        { error: "User not found or unavailable." },
        { status: 404 }
      );
    }

    // Check if optional session exists (if visitor happens to be logged in)
    const currentUser = await getCurrentUser();
    const senderId = currentUser?.userId || null;
    const isGuest = !senderId;

    // Prevent sending message to yourself if logged in
    if (senderId && recipient._id.toString() === senderId) {
      return NextResponse.json(
        { error: "You cannot send an anonymous message to yourself." },
        { status: 400 }
      );
    }

    // Check if recipient has blocked this user or IP
    if (senderId) {
      const isUserBlocked = await Block.findOne({
        blockerId: recipient._id,
        blockedSenderId: senderId,
      });
      if (isUserBlocked) {
        return NextResponse.json(
          { error: "Message could not be delivered. You have been blocked by this user." },
          { status: 403 }
        );
      }
    }

    // Check if recipient has blocked this IP
    const isIpBlocked = await Block.findOne({
      blockerId: recipient._id,
      blockedIp: ip,
    });
    if (isIpBlocked) {
      return NextResponse.json(
        { error: "Message could not be delivered. You have been blocked by this user." },
        { status: 403 }
      );
    }

    // Create the message
    await Message.create({
      senderId,
      receiverId: recipient._id,
      content,
      isRead: false,
      isDeleted: false,
      isGuest,
      senderIp: ip,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Anonymous message sent!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public send message error:", error);
    return NextResponse.json(
      { error: "Failed to deliver anonymous message" },
      { status: 500 }
    );
  }
}

