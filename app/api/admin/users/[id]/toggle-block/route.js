import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import { getCurrentUser } from "@/lib/jwt.js";

export async function PATCH(req, { params }) {
  try {
    const payload = await getCurrentUser();
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (id === payload.userId) {
      return NextResponse.json(
        { error: "You cannot block your own admin account" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    return NextResponse.json({
      success: true,
      isBlocked: user.isBlocked,
      message: user.isBlocked
        ? `User @${user.username} has been blocked`
        : `User @${user.username} has been unblocked`,
    });
  } catch (error) {
    console.error("Toggle block error:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

