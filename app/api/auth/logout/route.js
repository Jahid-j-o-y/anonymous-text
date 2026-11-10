import { NextResponse } from "next/server";
import { clearTokenCookie } from "@/lib/jwt.js";

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  clearTokenCookie(res);
  return res;
}

