import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import ChatRoom from "@/models/ChatRoom.js";
import { containsOffensiveWords, OFFENSIVE_ERROR_MESSAGE } from "@/lib/badWords.js";
import { z } from "zod";

const chatSendSchema = z.object({
  participantId: z.string().min(1),
  content: z.string().trim().min(1).max(500),
});

export async function POST(req, { params }) {
  try {
    const { roomId } = await params;
    if (!roomId || roomId.length !== 24) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = chatSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid message format" },
        { status: 400 }
      );
    }

    const { participantId, content } = parsed.data;

    // Check offensive words filter
    if (containsOffensiveWords(content)) {
      return NextResponse.json(
        { error: OFFENSIVE_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    await connectDB();

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    if (room.status === "ended") {
      return NextResponse.json(
        { error: "This chat has ended. Please start a new chat." },
        { status: 400 }
      );
    }

    // Verify sender is a participant
    const sender = room.participants.find(
      (p) => p.participantId === participantId
    );
    if (!sender) {
      return NextResponse.json(
        { error: "You are not a participant in this room" },
        { status: 403 }
      );
    }

    // Append message
    const newMessage = {
      senderAlias: sender.alias,
      participantId,
      content,
      createdAt: new Date(),
    };

    room.messages.push(newMessage);
    await room.save();

    return NextResponse.json({
      success: true,
      message: {
        senderAlias: sender.alias,
        isMe: true,
        content,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Chat send error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

