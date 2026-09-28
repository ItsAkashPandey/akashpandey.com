export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const webhookUrl = process.env.CHAT_LOG_WEBHOOK_URL;
  const webhookToken = process.env.CHAT_LOG_WEBHOOK_TOKEN;
  if (!webhookUrl || !webhookToken) {
    return NextResponse.json(
      {
        error:
          "Reset needs CHAT_LOG_WEBHOOK_URL and CHAT_LOG_WEBHOOK_TOKEN (the same value as TOKEN in the Apps Script).",
      },
      { status: 400 },
    );
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: webhookToken, action: "reset" }),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => null)) as {
    reset?: boolean;
    error?: string;
  } | null;

  // Apps Script answers 200 even when it fails, and an older script without
  // the reset action just reports "written: 0": only `reset: true` counts.
  if (!response.ok || json?.error || !json?.reset) {
    return NextResponse.json(
      {
        error:
          json?.error ||
          "The sheet was not reset. Update the Apps Script from docs/chat-logging.md; older versions have no reset action.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
