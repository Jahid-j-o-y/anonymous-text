import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import ChatRoom from "@/models/ChatRoom.js";
import ChatQueue from "@/models/ChatQueue.js";

const ANONYMOUS_ALIASES = [
  "Anonymous Fox",
  "Anonymous Panda",
  "Anonymous Wolf",
  "Anonymous Koala",
  "Anonymous Owl",
  "Anonymous Dolphin",
  "Anonymous Falcon",
  "Anonymous Tiger",
  "Anonymous Otter",
  "Anonymous Lynx",
  "Anonymous Badger",
  "Anonymous Hawk",
];

function getRandomAlias() {
  const index = Math.floor(Math.random() * ANONYMOUS_ALIASES.length);
  return ANONYMOUS_ALIASES[index];
}

export async function POST(req) {
  try {
    const body = await req.json();
    let { participantId } = body;

    if (!participantId) {
      participantId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const myAlias = getRandomAlias();

    await connectDB();

    // 1. Check if another stranger is waiting in the queue
    const waitingStranger = await ChatQueue.findOne({
      status: "waiting",
      participantId: { $ne: participantId },
    }).sort({ createdAt: 1 });

    if (waitingStranger) {
      // Create a 1-on-1 active Chat Room
      const partnerAlias = waitingStranger.alias || getRandomAlias();

      const newRoom = await ChatRoom.create({
        status: "active",
        participants: [
          { participantId: waitingStranger.participantId, alias: partnerAlias },
          { participantId, alias: myAlias },
        ],
        messages: [
          {
            senderAlias: "System",
            participantId: "system",
            content: `Connected! You are chatting with ${partnerAlias}. Remember to be respectful and safe.`,
            createdAt: new Date(),
          },
        ],
      });

      // Update the waiting stranger's queue status so their polling hook transitions to the room
      waitingStranger.status = "matched";
      waitingStranger.roomId = newRoom._id;
      await waitingStranger.save();

      // Clean up current participant from queue if any
      await ChatQueue.deleteMany({ participantId });

      return NextResponse.json({
        status: "matched",
        roomId: newRoom._id.toString(),
        participantId,
        alias: myAlias,
        partnerAlias,
      });
    }

    // 2. If no stranger is waiting, place current user in the queue
    await ChatQueue.findOneAndUpdate(
      { participantId },
      {
        participantId,
        alias: myAlias,
        status: "waiting",
        roomId: null,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      status: "waiting",
      participantId,
      alias: myAlias,
    });
  } catch (error) {
    console.error("Chat join error:", error);
    return NextResponse.json(
      { error: "Failed to join live matchmaking queue" },
      { status: 500 }
    );
  }
}

