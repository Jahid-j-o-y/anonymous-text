import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import { getCurrentUser } from "@/lib/jwt.js";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: "Your account is blocked", isBlocked: true },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

