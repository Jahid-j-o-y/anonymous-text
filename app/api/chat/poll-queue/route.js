import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import ChatRoom from "@/models/ChatRoom.js";
import ChatQueue from "@/models/ChatQueue.js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json({ error: "participantId required" }, { status: 400 });
    }

    await connectDB();

    const queueRecord = await ChatQueue.findOne({ participantId });

    if (!queueRecord) {
      return NextResponse.json({ status: "not_found" });
    }

    if (queueRecord.status === "matched" && queueRecord.roomId) {
      const room = await ChatRoom.findById(queueRecord.roomId);
      if (room) {
        const partner = room.participants.find(
          (p) => p.participantId !== participantId
        );
        const myRecord = room.participants.find(
          (p) => p.participantId === participantId
        );

        // Delete from queue since room is active
        await ChatQueue.deleteOne({ _id: queueRecord._id });

        return NextResponse.json({
          status: "matched",
          roomId: room._id.toString(),
          alias: myRecord?.alias || "You",
          partnerAlias: partner?.alias || "Stranger",
        });
      }
    }

    return NextResponse.json({ status: "waiting" });
  } catch (error) {
    console.error("Poll queue error:", error);
    return NextResponse.json(
      { error: "Failed to poll queue status" },
      { status: 500 }
    );
  }
}

