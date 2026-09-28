import type { Pool, PoolConfig } from "pg";

/**
 * TLS settings for the chat-log database. Certificates are verified unless
 * the connection string says `sslmode=no-verify` (or `disable`, for a local
 * database), or CHAT_LOG_DATABASE_SSL=no-verify is set for a provider whose
 * certificate chain Node does not trust.
 */
export function connectionConfig(connectionString: string): PoolConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return { connectionString };
  }

  const mode =
    process.env.CHAT_LOG_DATABASE_SSL || url.searchParams.get("sslmode") || "";
  // pg reads sslmode itself and would override the settings below.
  url.searchParams.delete("sslmode");
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  return {
    connectionString: url.toString(),
    ssl:
      mode === "disable" || (local && !mode)
        ? false
        : { rejectUnauthorized: mode !== "no-verify" },
  };
}

type Globals = typeof globalThis & {
  __kasiChatLogPool?: Pool;
  __kasiChatLogSchema?: Promise<void>;
  __kasiChatLogPrunedAt?: number;
};
const globals = globalThis as Globals;

export async function getChatLogPool(databaseUrl: string) {
  if (!globals.__kasiChatLogPool) {
    // pg is CommonJS; depending on the bundler, Pool is on the module or on
    // its default export.
    const pg = (await import("pg")) as unknown as {
      Pool?: typeof import("pg").Pool;
      default?: { Pool: typeof import("pg").Pool };
    };
    const Pool = pg.Pool ?? pg.default!.Pool;
    globals.__kasiChatLogPool = new Pool({
      ...connectionConfig(databaseUrl),
      max: 5,
    });
  }
  return globals.__kasiChatLogPool;
}

/**
 * Creates the table and indexes. Runs once per server instance; it used to
 * run five statements before every message and every admin refresh.
 */
export function ensureChatLogTable(pool: Pool) {
  globals.__kasiChatLogSchema ??= (async () => {
    await pool.query(`
      create table if not exists chat_logs (
        id bigserial primary key,
        timestamp timestamptz not null,
        visitor_id text not null,
        visitor_name text,
        conversation_id text not null,
        role text not null check (role in ('user', 'assistant')),
        message text not null,
        notes text,
        created_at timestamptz not null default now()
      )
    `);
    await pool.query(
      `create index if not exists chat_logs_timestamp_id_idx on chat_logs (timestamp desc, id desc)`,
    );
    await pool.query(
      `create index if not exists chat_logs_visitor_id_idx on chat_logs (visitor_id)`,
    );
    await pool.query(
      `create index if not exists chat_logs_conversation_id_idx on chat_logs (conversation_id)`,
    );
  })().catch((error) => {
    globals.__kasiChatLogSchema = undefined;
    throw error;
  });
  return globals.__kasiChatLogSchema;
}

/** Days to keep chat logs; 0 keeps them forever. Default 180. */
export function retentionDays() {
  const value = Number(process.env.CHAT_LOG_RETENTION_DAYS ?? 180);
  return Number.isFinite(value) && value >= 0 ? value : 180;
}

/** Deletes logs older than the retention period, at most every six hours. */
export async function pruneChatLogs(pool: Pool) {
  const days = retentionDays();
  const now = Date.now();
  if (!days || now - (globals.__kasiChatLogPrunedAt ?? 0) < 6 * 3_600_000) {
    return;
  }
  globals.__kasiChatLogPrunedAt = now;
  await pool.query(
    `delete from chat_logs where timestamp < now() - make_interval(days => $1)`,
    [days],
  );
}
