import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import { getCurrentUser } from "@/lib/jwt.js";

export async function GET(req) {
  try {
    const payload = await getCurrentUser();
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    await connectDB();

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("_id fullName username email role isBlocked createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const dtos = users.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      role: u.role,
      isBlocked: Boolean(u.isBlocked),
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: dtos });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

