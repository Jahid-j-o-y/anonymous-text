import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth_token";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || "fallback-secret-development-key-32chars!";
  return new TextEncoder().encode(secret);
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Static files and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let user = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      user = {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
        isBlocked: Boolean(payload.isBlocked),
      };
    } catch {
      user = null;
    }
  }

  const isPublicAuthRoute = pathname === "/" || pathname === "/register";
  const isAdminRoute = pathname.startsWith("/admin");
  const isUserProtected =
    pathname === "/dashboard" ||
    pathname === "/compose" ||
    pathname.startsWith("/message/") ||
    pathname === "/password";

  // If user is blocked, force logout / clear cookie and redirect to login
  if (user && user.isBlocked) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set({
      name: COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  // Logged-in user trying to access public auth routes (/ or /register)
  if (isPublicAuthRoute && user) {
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin/reports", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protected user routes
  if (isUserProtected) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin/reports", request.url));
    }
  }

  // Admin routes
  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/register",
    "/dashboard",
    "/compose",
    "/message/:path*",
    "/password",
    "/admin/:path*",
  ],
};

