export const runtime = "nodejs";

import {
  ADMIN_SESSION_MAX_AGE,
  adminConfigProblem,
  adminSecretIsWeak,
  createAdminSessionCookieValue,
  getAdminCookieName,
  getAdminSessionSecret,
  getAdminUsername,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (await isRateLimited("admin-login", ip, 5, 5 * 60_000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  let username: unknown;
  let password: unknown;
  try {
    ({ username, password } = (await req.json()) as Record<string, unknown>);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password
  ) {
    return NextResponse.json(
      { error: "Missing username or password" },
      { status: 400 },
    );
  }

  const problem = adminConfigProblem();
  if (problem) {
    console.error(`[admin] login refused: ${problem}`);
    return NextResponse.json(
      { error: `Admin login is not configured on the server. ${problem}` },
      { status: 500 },
    );
  }

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  if (adminSecretIsWeak()) {
    console.warn("[admin] ADMIN_SESSION_SECRET is shorter than 32 characters.");
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    getAdminCookieName(),
    createAdminSessionCookieValue(getAdminUsername(), getAdminSessionSecret()),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    },
  );
  return res;
}
