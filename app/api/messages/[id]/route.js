import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Message from "@/models/Message.js";
import { getCurrentUser } from "@/lib/jwt.js";

export async function GET(req, { params }) {
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

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Authorization: User must be the receiver of this message
    if (message.receiverId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: "You are not authorized to view this message" },
        { status: 403 }
      );
    }

    // Mark as read if not already read
    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }

    let parentMessageDto = null;
    if (message.parentId) {
      const parent = await Message.findById(message.parentId).select(
        "_id content createdAt"
      );
      if (parent) {
        parentMessageDto = {
          id: parent._id.toString(),
          content: parent.content,
          createdAt: parent.createdAt,
        };
      }
    }

    // Explicit DTO: NEVER return senderId or any sender info to recipient
    const messageDto = {
      id: message._id.toString(),
      content: message.content,
      isRead: message.isRead,
      parentId: message.parentId ? message.parentId.toString() : null,
      parentMessage: parentMessageDto,
      isGuest: Boolean(message.isGuest || !message.senderId),
      createdAt: message.createdAt,
    };

    return NextResponse.json({ message: messageDto });
  } catch (error) {
    console.error("Single message GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve message" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
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

    // Authorization check: User must own the message
    if (message.receiverId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: "You are not authorized to delete this message" },
        { status: 403 }
      );
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Message delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}

