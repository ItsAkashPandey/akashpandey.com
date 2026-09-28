import {
  ensureChatLogTable,
  getChatLogPool,
  pruneChatLogs,
} from "./chat-log-postgres";

export type ChatLogRow = {
  timestamp: string;
  visitorId: string;
  visitorName: string | null;
  conversationId: string;
  role: "user" | "assistant";
  message: string;
  notes?: string | null;
};

export type ChatLogAppendResult =
  | { status: "disabled"; reason: string }
  | { status: "ok"; mode: "postgres" | "webhook" | "file" }
  | { status: "error"; error: string };

function safeParseJson(text: string): { error?: string } | null {
  try {
    return JSON.parse(text) as { error?: string };
  } catch {
    return null;
  }
}

/**
 * Google Sheets turns a cell that starts with = + - or @ into a formula, so a
 * chat message like `=IMPORTXML(...)` would run inside the log sheet. A
 * leading apostrophe makes Sheets store it as plain text (and hides the
 * apostrophe itself).
 */
export function sheetSafe(value: string | null | undefined) {
  if (typeof value !== "string") return value ?? null;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function sheetSafeRow(row: ChatLogRow): ChatLogRow {
  return {
    ...row,
    visitorName: sheetSafe(row.visitorName),
    message: sheetSafe(row.message) ?? "",
    notes: sheetSafe(row.notes),
  };
}

export function chatLogDatabaseUrl() {
  return (
    process.env.CHAT_LOG_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  );
}

export async function appendChatLogRows(
  rows: ChatLogRow[],
): Promise<ChatLogAppendResult> {
  const databaseUrl = chatLogDatabaseUrl();
  const webhookUrl = process.env.CHAT_LOG_WEBHOOK_URL;
  const filePath = process.env.CHAT_LOG_FILE_PATH;

  // Preferred simple setup: webhook (Google Sheets). If it fails, fall back
  // to Postgres (if configured) and then the file.
  if (webhookUrl) {
    try {
      const token = process.env.CHAT_LOG_WEBHOOK_TOKEN;
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(token ? { token } : {}),
          rows: rows.map(sheetSafeRow),
        }),
      });

      const body = await response.text().catch(() => "");
      if (!response.ok) {
        throw new Error(
          `Chat log webhook failed: ${response.status} ${response.statusText}`,
        );
      }

      // Apps Script answers 200 even when the script itself threw, so the
      // payload is the only reliable signal that the row was actually stored.
      const parsed = body ? safeParseJson(body) : null;
      if (parsed?.error) {
        throw new Error(`Chat log webhook rejected the write: ${parsed.error}`);
      }

      return { status: "ok", mode: "webhook" };
    } catch (error) {
      if (!databaseUrl && !filePath) {
        return {
          status: "error",
          error: error instanceof Error ? error.message : "Chat log webhook failed",
        };
      }
    }
  }

  if (databaseUrl) {
    try {
      const pool = await getChatLogPool(databaseUrl);
      await ensureChatLogTable(pool);
      await pool.query(
        `insert into chat_logs (timestamp, visitor_id, visitor_name, conversation_id, role, message, notes)
         select * from unnest($1::timestamptz[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[])`,
        [
          rows.map((row) => row.timestamp),
          rows.map((row) => row.visitorId),
          rows.map((row) => row.visitorName),
          rows.map((row) => row.conversationId),
          rows.map((row) => row.role),
          rows.map((row) => row.message),
          rows.map((row) => row.notes ?? null),
        ],
      );
      await pruneChatLogs(pool).catch((error) =>
        console.warn("[chat log] prune failed", error),
      );
      return { status: "ok", mode: "postgres" };
    } catch (error) {
      if (!filePath) {
        return {
          status: "error",
          error:
            error instanceof Error
              ? `Postgres chat log failed: ${error.message}`
              : "Postgres chat log failed",
        };
      }
    }
  }

  // Local append-only JSONL file, for development or a server with a
  // persistent disk. Opt-in with CHAT_LOG_FILE_PATH; Vercel's disk is thrown
  // away on every deploy.
  if (!filePath) {
    return { status: "disabled", reason: "No chat log destination configured" };
  }

  const { appendFile, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const resolvedPath = filePath.trim();
  await mkdir(path.dirname(resolvedPath), { recursive: true });
  await appendFile(
    resolvedPath,
    rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
    "utf-8",
  );
  return { status: "ok", mode: "file" };
}
