export function shouldUsePostgresSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "require") return true;
    if (sslmode === "disable") return false;

    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}

export async function getChatLogPool(databaseUrl: string) {
  const { Pool } = (await import("pg")) as any;
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
  return pool;
}

export async function ensureChatLogTable(pool: any) {
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

  await pool.query(`alter table chat_logs add column if not exists notes text`);

  await pool.query(
    `create index if not exists chat_logs_timestamp_id_idx on chat_logs (timestamp desc, id desc)`,
  );
  await pool.query(
    `create index if not exists chat_logs_visitor_id_idx on chat_logs (visitor_id)`,
  );
  await pool.query(
    `create index if not exists chat_logs_conversation_id_idx on chat_logs (conversation_id)`,
  );
}
