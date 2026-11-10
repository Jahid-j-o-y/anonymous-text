import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import ChatRoom from "@/models/ChatRoom.js";

export async function GET(req, { params }) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");

    if (!roomId || roomId.length !== 24) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    await connectDB();

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Chat room not found", status: "ended" }, { status: 404 });
    }

    // Heartbeat update for current participant
    if (participantId && room.status === "active") {
      const idx = room.participants.findIndex(
        (p) => p.participantId === participantId
      );
      if (idx !== -1) {
        room.participants[idx].lastSeen = new Date();
        await room.save();
      }
    }

    // Map messages with safe format
    const formattedMessages = room.messages.map((m) => ({
      id: m._id.toString(),
      senderAlias: m.senderAlias,
      isMe: participantId ? m.participantId === participantId : false,
      isSystem: m.participantId === "system",
      content: m.content,
      createdAt: m.createdAt,
    }));

    const partner = room.participants.find(
      (p) => p.participantId !== participantId
    );

    return NextResponse.json({
      status: room.status,
      endedBy: room.endedBy,
      partnerAlias: partner?.alias || "Stranger",
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Room fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room messages" },
      { status: 500 }
    );
  }
}

