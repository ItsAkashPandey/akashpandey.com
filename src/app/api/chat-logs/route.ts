export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdminSession } from "@/lib/admin-auth";
import { chatLogDatabaseUrl } from "@/lib/chat-log";
import {
  ensureChatLogTable,
  getChatLogPool,
  pruneChatLogs,
} from "@/lib/chat-log-postgres";
import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

type Row = {
  id?: number;
  timestamp: string;
  visitorId: string;
  visitorName: string | null;
  conversationId: string;
  role: "user" | "assistant";
  message: string;
  notes: string | null;
};

type WebhookRead = {
  rows?: Record<string, unknown>[];
  viewUrl?: string;
  error?: string;
} | null;

function toRow(raw: Record<string, unknown>): Row {
  return {
    ...(typeof raw.id === "number" || typeof raw.id === "string"
      ? { id: Number(raw.id) }
      : {}),
    timestamp:
      raw.timestamp instanceof Date
        ? raw.timestamp.toISOString()
        : String(raw.timestamp ?? ""),
    visitorId: String(raw.visitorId ?? ""),
    visitorName: raw.visitorName ? String(raw.visitorName) : null,
    conversationId: String(raw.conversationId ?? ""),
    role: raw.role === "assistant" ? "assistant" : "user",
    message: String(raw.message ?? ""),
    notes: raw.notes ? String(raw.notes) : null,
  };
}

const complete = (row: Row) =>
  Boolean(row.timestamp && row.visitorId && row.conversationId && row.message);

/**
 * Reads from the Apps Script web app. The current script reads over POST, so
 * the token stays out of URLs (and out of request logs). A script from before
 * that change only reads over GET; it still works, with a nudge to update.
 */
async function readWebhook(
  url: string,
  token: string | undefined,
  filters: Record<string, string>,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action: "read", ...filters }),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => null)) as WebhookRead;
  if (json?.error) throw new Error(json.error);
  if (Array.isArray(json?.rows)) {
    return { rows: json.rows, viewUrl: json.viewUrl, warning: null };
  }

  const legacy = new URL(url);
  for (const [key, value] of Object.entries(filters)) {
    legacy.searchParams.set(key, value);
  }
  if (token) legacy.searchParams.set("token", token);
  const legacyResponse = await fetch(legacy, { cache: "no-store" });
  const legacyJson = (await legacyResponse
    .json()
    .catch(() => null)) as WebhookRead;
  if (!legacyResponse.ok || legacyJson?.error) {
    throw new Error(
      legacyJson?.error || `Webhook read failed (${legacyResponse.status})`,
    );
  }
  return {
    rows: legacyJson?.rows ?? [],
    viewUrl: legacyJson?.viewUrl,
    warning:
      "The Apps Script is an older version that reads with the token in the URL. Paste the current script from docs/chat-logging.md to fix that.",
  };
}

export async function GET(req: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || 200, 1),
    2000,
  );
  const visitorId = url.searchParams.get("visitorId")?.trim() || "";
  const conversationId = url.searchParams.get("conversationId")?.trim() || "";
  const warnings: string[] = [];

  const webhookUrl = process.env.CHAT_LOG_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const filters: Record<string, string> = { limit: String(limit) };
      if (visitorId) filters.visitorId = visitorId;
      if (conversationId) filters.conversationId = conversationId;
      const result = await readWebhook(
        webhookUrl,
        process.env.CHAT_LOG_WEBHOOK_TOKEN,
        filters,
      );
      const rows = result.rows.map(toRow).filter(complete);
      return NextResponse.json(
        {
          rows,
          count: rows.length,
          storage: "webhook",
          ...(result.viewUrl ? { viewUrl: result.viewUrl } : {}),
          ...(result.warning ? { message: result.warning } : {}),
        },
        { headers: NO_STORE },
      );
    } catch (error) {
      warnings.push(
        `Google Sheets read failed: ${
          error instanceof Error ? error.message : "unknown error"
        }.`,
      );
    }
  }

  const databaseUrl = chatLogDatabaseUrl();
  if (databaseUrl) {
    try {
      const pool = await getChatLogPool(databaseUrl);
      await ensureChatLogTable(pool);
      await pruneChatLogs(pool).catch(() => undefined);

      const where: string[] = [];
      const params: (string | number)[] = [];
      if (visitorId) {
        params.push(visitorId);
        where.push(`visitor_id = $${params.length}`);
      }
      if (conversationId) {
        params.push(conversationId);
        where.push(`conversation_id = $${params.length}`);
      }
      params.push(limit);

      const result = await pool.query(
        `select id, timestamp, visitor_id as "visitorId", visitor_name as "visitorName",
                conversation_id as "conversationId", role, message, notes
           from chat_logs${where.length ? ` where ${where.join(" and ")}` : ""}
          order by timestamp desc, id desc
          limit $${params.length}`,
        params,
      );
      const rows = result.rows.map(toRow).reverse();
      return NextResponse.json(
        {
          rows,
          count: rows.length,
          storage: "postgres",
          ...(warnings.length ? { message: warnings.join(" ") } : {}),
        },
        { headers: NO_STORE },
      );
    } catch (error) {
      warnings.push(
        `Postgres read failed: ${
          error instanceof Error ? error.message : "unknown error"
        }.`,
      );
    }
  }

  const filePath = process.env.CHAT_LOG_FILE_PATH;
  if (filePath) {
    try {
      const { readFile } = await import("node:fs/promises");
      const rows = (await readFile(filePath, "utf-8"))
        .split("\n")
        .flatMap((line) => {
          try {
            return line.trim() ? [toRow(JSON.parse(line))] : [];
          } catch {
            return [];
          }
        })
        .filter(
          (row) =>
            complete(row) &&
            (!visitorId || row.visitorId === visitorId) &&
            (!conversationId || row.conversationId === conversationId),
        )
        .slice(-limit);
      return NextResponse.json(
        {
          rows,
          count: rows.length,
          storage: "file",
          ...(warnings.length ? { message: warnings.join(" ") } : {}),
        },
        { headers: NO_STORE },
      );
    } catch {
      warnings.push("No log file yet.");
    }
  }

  return NextResponse.json(
    {
      rows: [],
      count: 0,
      storage: "none",
      message: [
        ...warnings,
        "Chat storage is not connected. Set CHAT_LOG_DATABASE_URL (Postgres) or CHAT_LOG_WEBHOOK_URL (Google Sheets).",
      ].join(" "),
    },
    { headers: NO_STORE },
  );
}
