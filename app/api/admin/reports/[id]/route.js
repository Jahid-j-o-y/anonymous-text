import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Report from "@/models/Report.js";
import Message from "@/models/Message.js";
import User from "@/models/User.js";
import { getCurrentUser } from "@/lib/jwt.js";
import { adminReportActionSchema } from "@/lib/validations.js";

export async function PATCH(req, { params }) {
  try {
    const payload = await getCurrentUser();
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = adminReportActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action. Supported: dismiss, delete_message, block_sender" },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    await connectDB();

    const report = await Report.findById(id).populate("messageId");
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (action === "dismiss") {
      report.status = "dismissed";
      await report.save();
      return NextResponse.json({
        success: true,
        message: "Report dismissed",
        status: report.status,
      });
    }

    if (action === "delete_message") {
      if (report.messageId) {
        await Message.findByIdAndUpdate(report.messageId._id, {
          isDeleted: true,
        });
      }
      report.status = "resolved";
      await report.save();
      return NextResponse.json({
        success: true,
        message: "Offending message deleted and report resolved",
        status: report.status,
      });
    }

    if (action === "block_sender") {
      if (!report.messageId) {
        return NextResponse.json(
          { error: "Associated message was not found" },
          { status: 404 }
        );
      }
      const message = await Message.findById(report.messageId._id);
      if (message && message.senderId) {
        await User.findByIdAndUpdate(message.senderId, { isBlocked: true });
      }
      report.status = "resolved";
      await report.save();
      return NextResponse.json({
        success: true,
        message: "Sender account has been blocked and report resolved",
        status: report.status,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Admin report action error:", error);
    return NextResponse.json(
      { error: "Failed to process report action" },
      { status: 500 }
    );
  }
}

