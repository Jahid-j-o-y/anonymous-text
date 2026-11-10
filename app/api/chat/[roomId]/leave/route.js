import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import ChatRoom from "@/models/ChatRoom.js";

export async function POST(req, { params }) {
  try {
    const { roomId } = await params;
    if (!roomId || roomId.length !== 24) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const body = await req.json();
    const { participantId } = body;

    await connectDB();

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return NextResponse.json({ success: true });
    }

    if (room.status !== "ended") {
      room.status = "ended";
      room.endedBy = participantId;
      room.messages.push({
        senderAlias: "System",
        participantId: "system",
        content: "A participant has left the chat. The conversation has ended.",
        createdAt: new Date(),
      });
      await room.save();
    }

    return NextResponse.json({ success: true, message: "Chat ended" });
  } catch (error) {
    console.error("Chat leave error:", error);
    return NextResponse.json(
      { error: "Failed to leave chat" },
      { status: 500 }
    );
  }
}

