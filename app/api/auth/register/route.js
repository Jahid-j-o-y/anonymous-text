import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import { registerSchema } from "@/lib/validations.js";
import { signToken, setTokenCookie } from "@/lib/jwt.js";

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { fullName, username, email, password } = parsed.data;

    await connectDB();

    // Check existing username
    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Check existing email
    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
      isBlocked: false,
    });

    const token = await signToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      isBlocked: user.isBlocked,
    });

    const res = NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );

    setTokenCookie(res, token);
    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}

