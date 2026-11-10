import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import { loginSchema } from "@/lib/validations.js";
import { signToken, setTokenCookie } from "@/lib/jwt.js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit.js";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 60 * 1000 });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const cleanId = identifier.trim().toLowerCase();

    await connectDB();

    // Find by either username or email
    const user = await User.findOne({
      $or: [{ username: cleanId }, { email: cleanId }],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { error: "Your account has been blocked. Please contact an administrator." },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      isBlocked: user.isBlocked,
    });

    const res = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    setTokenCookie(res, token);
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}

