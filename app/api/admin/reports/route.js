import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Report from "@/models/Report.js";
import Message from "@/models/Message.js";
import User from "@/models/User.js";
import { getCurrentUser } from "@/lib/jwt.js";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await connectDB();

    // Fetch pending reports
    const reports = await Report.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate({
        path: "messageId",
        select: "content senderId isDeleted createdAt",
        populate: {
          path: "senderId",
          select: "username isBlocked",
        },
      })
      .populate({
        path: "reporterId",
        select: "username",
      })
      .lean();

    const dtos = reports.map((r) => {
      const msg = r.messageId;
      const sender = msg?.senderId;
      return {
        id: r._id.toString(),
        messageId: msg ? msg._id.toString() : null,
        messageContent: msg ? msg.content : "[Deleted or Not Available]",
        isMessageDeleted: msg ? Boolean(msg.isDeleted) : true,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
        // The sender username is displayed here for administrative moderation
        senderUsername: sender ? sender.username : "Unknown User",
        senderId: sender ? sender._id.toString() : null,
        senderIsBlocked: sender ? Boolean(sender.isBlocked) : false,
        reporterUsername: r.reporterId ? r.reporterId.username : "Anonymous Reporter",
      };
    });

    return NextResponse.json({ reports: dtos });
  } catch (error) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

