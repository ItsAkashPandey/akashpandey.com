export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";

async function requireAdminSession(): Promise<NextResponse | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error: "Admin auth is not configured",
        hint: "Set ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET in .env.local",
      },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(getAdminCookieName())?.value;
  if (!session || !verifyAdminSessionCookieValue(session, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const webhookUrl = process.env.CHAT_LOG_WEBHOOK_URL;
  const webhookToken = process.env.CHAT_LOG_WEBHOOK_TOKEN;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        error: "CHAT_LOG_WEBHOOK_URL is not configured",
        hint: "Set up the Google Sheets Apps Script Web App and put its URL in CHAT_LOG_WEBHOOK_URL",
      },
      { status: 400 },
    );
  }

  if (!webhookToken) {
    return NextResponse.json(
      {
        error: "CHAT_LOG_WEBHOOK_TOKEN is not configured",
        hint: "Set LOG_TOKEN in Apps Script and CHAT_LOG_WEBHOOK_TOKEN in .env.local",
      },
      { status: 400 },
    );
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
    },
    body: JSON.stringify({ token: webhookToken, action: "reset" }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return NextResponse.json(
      {
        error: "Reset failed",
        detail: `${response.status} ${response.statusText}${text ? ` — ${text}` : ""}`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
