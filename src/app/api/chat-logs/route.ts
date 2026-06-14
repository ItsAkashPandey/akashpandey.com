export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "node:path";
import {
  getAdminCookieName,
  getAdminSessionSecret,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-auth";
import { ensureChatLogTable, getChatLogPool } from "@/lib/chat-log-postgres";

async function requireAdminSession(): Promise<NextResponse | null> {
  const secret = getAdminSessionSecret();

  const cookieStore = await cookies();
  const session = cookieStore.get(getAdminCookieName())?.value;
  if (!session || !verifyAdminSessionCookieValue(session, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function safeParseJsonLine(line: string): any | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") || "200"), 1),
    2000,
  );
  const visitorId = url.searchParams.get("visitorId")?.trim() || null;
  const conversationId = url.searchParams.get("conversationId")?.trim() || null;

  let readWarning: string | null = null;

  // Preferred simple storage: Google Sheets (Apps Script Web App)
  const webhookUrl = process.env.CHAT_LOG_WEBHOOK_URL;
  const webhookToken = process.env.CHAT_LOG_WEBHOOK_TOKEN;
  if (webhookUrl) {
    try {
      const webhook = new URL(webhookUrl);
      webhook.searchParams.set("limit", String(limit));
      if (visitorId) webhook.searchParams.set("visitorId", visitorId);
      if (conversationId)
        webhook.searchParams.set("conversationId", conversationId);
      if (webhookToken) webhook.searchParams.set("token", webhookToken);

      const response = await fetch(webhook.toString(), {
        method: "GET",
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Webhook read failed: ${response.status} ${response.statusText}${text ? ` — ${text}` : ""}`,
        );
      }

      const json = (await response.json().catch(() => null)) as {
        rows?: any[];
        viewUrl?: string;
      } | null;
      const rawRows = Array.isArray(json?.rows) ? json!.rows : [];

      const rows = rawRows
        .map((r) => ({
          timestamp: String(r.timestamp || ""),
          visitorId: String(r.visitorId || ""),
          visitorName: (r.visitorName ?? null) ? String(r.visitorName) : null,
          conversationId: String(r.conversationId || ""),
          role: r.role === "assistant" ? "assistant" : "user",
          message: String(r.message || ""),
        }))
        .filter(
          (r) => r.timestamp && r.visitorId && r.conversationId && r.message,
        );

      return NextResponse.json(
        {
          rows,
          count: rows.length,
          storage: "webhook",
          ...(json?.viewUrl ? { viewUrl: json.viewUrl } : null),
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    } catch (error) {
      readWarning = `Webhook read failed; falling back. ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }

  const databaseUrl =
    process.env.CHAT_LOG_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const pool = await getChatLogPool(databaseUrl);
      await ensureChatLogTable(pool);

      const where: string[] = [];
      const params: any[] = [];
      if (visitorId) {
        params.push(visitorId);
        where.push(`visitor_id = $${params.length}`);
      }
      if (conversationId) {
        params.push(conversationId);
        where.push(`conversation_id = $${params.length}`);
      }

      params.push(limit);
      const limitParam = `$${params.length}`;

      const sql = `select id, timestamp, visitor_id as "visitorId", visitor_name as "visitorName", conversation_id as "conversationId", role, message from chat_logs${
        where.length ? ` where ${where.join(" and ")}` : ""
      } order by timestamp desc, id desc limit ${limitParam}`;

      const result = await pool.query(sql, params);
      const rows = (result.rows || []).slice().reverse();

      return NextResponse.json(
        {
          rows,
          count: rows.length,
          storage: "postgres",
          ...(readWarning ? { message: readWarning } : null),
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    } catch (error) {
      readWarning = `${readWarning ? `${readWarning} ` : ""}Postgres read failed; falling back. ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }

  const filePath = process.env.CHAT_LOG_FILE_PATH
    ? path.resolve(process.env.CHAT_LOG_FILE_PATH)
    : path.join(process.cwd(), "logs", "chat-log.jsonl");

  // Serverless / Vercel safeguard: prevent aggressive project-wide tracing
  if (process.env.VERCEL === "1" && !process.env.CHAT_LOG_FILE_PATH) {
    return NextResponse.json(
      {
        rows: [],
        storage: "none",
        message:
          "Chat storage is not connected. Add CHAT_LOG_DATABASE_URL for Postgres, or CHAT_LOG_WEBHOOK_URL for Google Sheets, in your Vercel environment variables.",
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      },
    );
  }

  let text = "";
  try {
    const { readFile } = await import("node:fs/promises");
    text = await readFile(filePath, "utf-8");
  } catch (error) {
    return NextResponse.json(
      {
        rows: [],
        filePath,
        message: readWarning
          ? `${readWarning} No log file found yet. If you're deployed on a serverless host, local file logs won't persist; use Google Sheets logging instead.`
          : "No log file found yet. If you're deployed on a serverless host, local file logs won't persist; use Google Sheets logging instead.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  const lines = text.split("\n");
  const parsed = lines.map(safeParseJsonLine).filter(Boolean) as Array<
    Record<string, any>
  >;

  const filtered = parsed.filter((row) => {
    if (visitorId && row.visitorId !== visitorId) return false;
    if (conversationId && row.conversationId !== conversationId) return false;
    return true;
  });

  const rows = filtered.slice(-limit);

  return NextResponse.json(
    {
      rows,
      filePath,
      count: rows.length,
      storage: "file",
      ...(readWarning ? { message: readWarning } : null),
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
