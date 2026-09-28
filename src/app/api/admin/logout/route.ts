export const runtime = "nodejs";

import { getAdminCookieName } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

/**
 * Signs this browser out. To sign out everywhere, change
 * ADMIN_SESSION_VERSION (or the password) and redeploy.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieName(), "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
