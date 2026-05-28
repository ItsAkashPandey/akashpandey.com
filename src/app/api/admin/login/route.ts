export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createAdminSessionCookieValue, getAdminCookieName } from "@/lib/admin-auth";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string, limit = 5, windowMs = 5 * 60_000): boolean {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export async function POST(req: Request) {
  try {
    const rateLimitKey = getClientIp(req);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 },
      );
    }

    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!expectedUsername || !expectedPassword || !sessionSecret) {
      return NextResponse.json(
        {
          error: "Admin auth is not configured",
          hint: "Set ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET in .env.local",
        },
        { status: 500 },
      );
    }

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const cookieName = getAdminCookieName();
    const cookieValue = createAdminSessionCookieValue(username, sessionSecret);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
