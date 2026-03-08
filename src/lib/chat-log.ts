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

function shouldUsePostgresSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "require") return true;
    if (sslmode === "disable") return false;

    const host = url.hostname;
    // Default to no SSL for typical local dev.
    if (host === "localhost" || host === "127.0.0.1") return false;

    // Many managed Postgres providers (including Supabase) require SSL.
    return true;
  } catch {
    // If it's not a URL we can parse, keep the pg default.
    return false;
  }
}

type WebhookPayload = {
  token?: string;
  rows: ChatLogRow[];
};

export async function appendChatLogRows(rows: ChatLogRow[]) {
  const databaseUrl =
    process.env.CHAT_LOG_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;
  const webhookUrl = process.env.CHAT_LOG_WEBHOOK_URL;
  const filePath = process.env.CHAT_LOG_FILE_PATH || "./logs/chat-log.jsonl";
  if (!databaseUrl && !webhookUrl && !filePath) {
    return {
      status: "disabled",
      reason: "No chat log destination configured",
    } as const;
  }

  // Preferred simple setup: webhook (Google Sheets).
  // If it fails, fall back to Postgres (if configured) and then file.
  if (webhookUrl) {
    try {
      const token = process.env.CHAT_LOG_WEBHOOK_TOKEN;

      const payload: WebhookPayload = token ? { token, rows } : { rows };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Chat log webhook failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`,
        );
      }

      return { status: "ok", mode: "webhook" } as const;
    } catch (error) {
      // continue to next destination
      if (!databaseUrl && !filePath) {
        return {
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Chat log webhook failed",
        } as const;
      }
    }
  }

  // Optional: Postgres
  if (databaseUrl) {
    try {
      const { Pool } = (await import("pg")) as any;

      // Reuse a global pool across hot reloads.
      const globalAny = globalThis as any;
      const pool: any =
        globalAny.__halChatLogPool ||
        new Pool({
          connectionString: databaseUrl,
          max: 5,
          ...(shouldUsePostgresSsl(databaseUrl)
            ? { ssl: { rejectUnauthorized: false } }
            : null),
        });
      globalAny.__halChatLogPool = pool;

      const sql =
        "insert into chat_logs (timestamp, visitor_id, visitor_name, conversation_id, role, message) values ($1,$2,$3,$4,$5,$6)";

      for (const row of rows) {
        await pool.query(sql, [
          row.timestamp,
          row.visitorId,
          row.visitorName,
          row.conversationId,
          row.role,
          row.message,
        ]);
      }

      return { status: "ok", mode: "postgres" } as const;
    } catch (error) {
      if (!filePath) {
        return {
          status: "error",
          error:
            error instanceof Error
              ? `Postgres chat log failed: ${error.message}`
              : "Postgres chat log failed",
        } as const;
      }
      // else fall back to file
    }
  }

  // Fallback: local append-only JSONL file (no external API). Requires a persistent filesystem.
  // NOTE: This is not reliable on serverless platforms that do not persist disk writes.
  const { appendFile, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const resolvedPath = filePath!.trim();
  const directory = path.dirname(resolvedPath);
  await mkdir(directory, { recursive: true });
  const lines = rows.map((row) => JSON.stringify(row)).join("\n") + "\n";
  await appendFile(resolvedPath, lines, "utf-8");
  return { status: "ok", mode: "file" } as const;
}
