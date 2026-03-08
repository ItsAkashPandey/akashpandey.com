"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";

type ChatLogRow = {
  id?: number;
  timestamp: string;
  visitorId: string;
  visitorName: string | null;
  conversationId: string;
  role: "user" | "assistant";
  message: string;
};

type ApiResponse = {
  rows: ChatLogRow[];
  storage?: "postgres" | "webhook" | "file";
  filePath?: string;
  count?: number;
  message?: string;
  viewUrl?: string;
};

function formatTimestamp(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: iso, time: "" };
  }

  const date = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
  return { date, time };
}

function compareRow(a: ChatLogRow, b: ChatLogRow) {
  const t = a.timestamp.localeCompare(b.timestamp);
  if (t !== 0) return t;
  return (a.id ?? 0) - (b.id ?? 0);
}

type ConversationGroup = {
  conversationId: string;
  visitorId: string;
  visitorName: string | null;
  rows: ChatLogRow[];
  lastTimestamp: string;
  lastId: number;
};

type VisitorGroup = {
  visitorId: string;
  visitorName: string | null;
  rows: ChatLogRow[];
  lastTimestamp: string;
  messageCount: number;
  conversationCount: number;
};

function toCsv(rows: ChatLogRow[]): string {
  const headers = [
    "timestamp",
    "visitorId",
    "visitorName",
    "conversationId",
    "role",
    "message",
  ];

  const escape = (value: unknown) => {
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((k) => escape((row as any)[k])).join(","));
  }
  return lines.join("\n");
}

export default function ChatLogsClient({
  adminUsername,
}: {
  adminUsername: string | null;
}) {
  const [limit, setLimit] = useState(400);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetText, setResetText] = useState("");
  const [groupMode, setGroupMode] = useState<"visitors" | "conversations">(
    "visitors",
  );
  const [sortMode, setSortMode] = useState<"recent" | "name" | "visitorId">(
    "recent",
  );
  const [openItemId, setOpenItemId] = useState<string | undefined>(undefined);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    return params.toString();
  }, [limit]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Bust any intermediary caching layers.
      const response = await fetch(`/api/chat-logs?${queryString}&_=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );
      if (response.status === 401) {
        window.location.href = `/admin/login?next=${encodeURIComponent("/admin")}`;
        return;
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Request failed (${response.status})`);
      }

      const json = (await response.json()) as ApiResponse;
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  const resetSheet = useCallback(async () => {
    setIsResetting(true);
    setError(null);
    try {
      const response = await fetch(`/api/chat-logs/reset?_=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (response.status === 401) {
        window.location.href = `/admin/login?next=${encodeURIComponent("/admin")}`;
        return;
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Reset failed (${response.status})`);
      }

      setOpenItemId(undefined);
      setSearch("");
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsResetting(false);
    }
  }, [fetchLogs]);

  useEffect(() => {
    // Initial fetch + interval refresh (no visible refresh controls).
    fetchLogs();
    refreshTimerRef.current = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLogs();
      }
    }, 5000);

    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [fetchLogs]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }, []);

  const downloadCsv = useCallback(() => {
    const rows = data?.rows ?? [];
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [data]);

  const normalizeSearch = (input: string) => input.trim().toLowerCase();
  const searchText = useMemo(() => normalizeSearch(search), [search]);

  const rows = useMemo(() => {
    const list = (data?.rows ?? []).slice();
    list.sort(compareRow);
    if (!searchText) return list;
    return list.filter((row) => {
      const haystack = `${row.visitorName || ""} ${row.visitorId} ${row.conversationId} ${row.message}`.toLowerCase();
      return haystack.includes(searchText);
    });
  }, [data]);

  const conversations = useMemo((): ConversationGroup[] => {
    const byId = new Map<string, ConversationGroup>();

    for (const row of rows) {
      const existing = byId.get(row.conversationId);
      if (!existing) {
        byId.set(row.conversationId, {
          conversationId: row.conversationId,
          visitorId: row.visitorId,
          visitorName: row.visitorName,
          rows: [row],
          lastTimestamp: row.timestamp,
          lastId: row.id ?? 0,
        });
        continue;
      }

      existing.rows.push(row);
      existing.rows.sort(compareRow);

      const last = existing.rows[existing.rows.length - 1];
      existing.lastTimestamp = last.timestamp;
      existing.lastId = last.id ?? existing.lastId;
      if (!existing.visitorName && row.visitorName) {
        existing.visitorName = row.visitorName;
      }
    }

    const list = Array.from(byId.values());
    list.sort((a, b) => {
      if (sortMode === "name") {
        const an = (a.visitorName || "").toLowerCase();
        const bn = (b.visitorName || "").toLowerCase();
        const t = an.localeCompare(bn);
        if (t !== 0) return t;
      }
      if (sortMode === "visitorId") {
        const t = a.visitorId.localeCompare(b.visitorId);
        if (t !== 0) return t;
      }

      const t = b.lastTimestamp.localeCompare(a.lastTimestamp);
      if (t !== 0) return t;
      return (b.lastId ?? 0) - (a.lastId ?? 0);
    });
    return list;
  }, [rows, sortMode]);

  const visitors = useMemo((): VisitorGroup[] => {
    const byId = new Map<string, VisitorGroup>();
    const conversationIdsByVisitor = new Map<string, Set<string>>();

    for (const row of rows) {
      const existing = byId.get(row.visitorId);
      if (!existing) {
        byId.set(row.visitorId, {
          visitorId: row.visitorId,
          visitorName: row.visitorName,
          rows: [row],
          lastTimestamp: row.timestamp,
          messageCount: 1,
          conversationCount: 1,
        });
        conversationIdsByVisitor.set(row.visitorId, new Set([row.conversationId]));
        continue;
      }

      existing.rows.push(row);
      existing.rows.sort(compareRow);
      existing.messageCount += 1;

      const set = conversationIdsByVisitor.get(row.visitorId) || new Set();
      set.add(row.conversationId);
      conversationIdsByVisitor.set(row.visitorId, set);
      existing.conversationCount = set.size;

      const last = existing.rows[existing.rows.length - 1];
      existing.lastTimestamp = last.timestamp;
      if (!existing.visitorName && row.visitorName) {
        existing.visitorName = row.visitorName;
      }
    }

    const list = Array.from(byId.values());
    list.sort((a, b) => {
      if (sortMode === "name") {
        const an = (a.visitorName || "").toLowerCase();
        const bn = (b.visitorName || "").toLowerCase();
        const t = an.localeCompare(bn);
        if (t !== 0) return t;
      }
      if (sortMode === "visitorId") {
        const t = a.visitorId.localeCompare(b.visitorId);
        if (t !== 0) return t;
      }
      return b.lastTimestamp.localeCompare(a.lastTimestamp);
    });
    return list;
  }, [rows, sortMode]);

  useEffect(() => {
    const list = groupMode === "visitors" ? visitors : conversations;
    if (!list.length) return;

    const firstId =
      groupMode === "visitors"
        ? (list[0] as VisitorGroup).visitorId
        : (list[0] as ConversationGroup).conversationId;

    if (!openItemId) {
      setOpenItemId(firstId);
      return;
    }

    const exists =
      groupMode === "visitors"
        ? visitors.some((v) => v.visitorId === openItemId)
        : conversations.some((c) => c.conversationId === openItemId);
    if (!exists) {
      setOpenItemId(firstId);
    }
  }, [conversations, groupMode, openItemId, visitors]);

  const storageLabel =
    data?.storage === "postgres"
      ? "Postgres"
      : data?.storage === "webhook"
        ? "Google Sheets"
      : data?.storage === "file"
        ? "Local file"
        : "—";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[14rem]">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          {adminUsername && (
            <p className="mt-1 text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{adminUsername}</span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-background/50 px-2 py-1">
              Source: {storageLabel}
            </span>
            {data?.storage === "webhook" && data?.viewUrl && (
              <a
                href={data.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border bg-background/50 px-2 py-1 hover:text-foreground"
              >
                Open sheet
              </a>
            )}
            {lastUpdated && (
              <span className="rounded-full border bg-background/50 px-2 py-1">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {isLoading && (
              <span className="rounded-full border bg-background/50 px-2 py-1">
                Syncing…
              </span>
            )}
            {data?.count !== undefined && (
              <span className="rounded-full border bg-background/50 px-2 py-1">
                Rows: {data.count}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-md border bg-background/50 px-3 py-2 text-sm"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      <section className="mt-6 rounded-xl border bg-background/50 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Search</span>
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, visitor id, conversation id, message…"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">View</span>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={groupMode}
              onChange={(e) => setGroupMode(e.target.value as any)}
            >
              <option value="visitors">Visitors</option>
              <option value="conversations">Conversations</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Sort</span>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
            >
              <option value="recent">Most recent</option>
              <option value="name">Name</option>
              <option value="visitorId">Visitor id</option>
            </select>
          </label>
        </div>

        {(error || data?.message || data?.filePath) && (
          <div className="mt-3 grid gap-2">
            {data?.filePath && (
              <p className="text-xs text-muted-foreground">File path: {data.filePath}</p>
            )}
            {error && <p className="text-sm text-rose-500">{error}</p>}
            {data?.message && (
              <p className="text-sm text-muted-foreground">{data.message}</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border bg-background/50">
        <div className="border-b px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">
                {groupMode === "visitors" ? "Visitors" : "Conversations"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Click an item to read the full chat.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={downloadCsv}
                disabled={!data?.rows?.length}
                title="Export the currently loaded rows (after search)"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-auto">
          {data && (groupMode === "visitors" ? visitors.length === 0 : conversations.length === 0) && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                No logs yet. Send a chat message first.
              </p>
            </div>
          )}

          <Accordion
            type="single"
            collapsible
            value={openItemId}
            onValueChange={(v) => setOpenItemId(v || undefined)}
          >
            {groupMode === "visitors"
              ? visitors.map((v) => {
                  const { date, time } = formatTimestamp(v.lastTimestamp);
                  const name = v.visitorName?.trim() || "Unknown";
                  return (
                    <AccordionItem key={v.visitorId} value={v.visitorId}>
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex w-full flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border bg-background px-2 py-0.5 text-xs">
                              {name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              visitor #{v.visitorId.slice(0, 8)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{v.messageCount} msgs</span>
                            <span>{v.conversationCount} conv</span>
                            <span className="whitespace-nowrap">
                              {date} {time}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4">
                        <div className="grid gap-4">
                          {Array.from(
                            v.rows.reduce((m, row) => {
                              const list = m.get(row.conversationId) || [];
                              list.push(row);
                              m.set(row.conversationId, list);
                              return m;
                            }, new Map<string, ChatLogRow[]>()),
                          ).map(([cid, cidRows]) => (
                            <div key={cid} className="rounded-xl border bg-background p-3">
                              <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>Conversation #{cid.slice(0, 8)}</span>
                                <span>{cidRows.length} msgs</span>
                              </div>
                              <div className="grid gap-3">
                                {cidRows.map((row, idx) => {
                                  const isUser = row.role === "user";
                                  const who = isUser ? name : "kasi";
                                  const ts = formatTimestamp(row.timestamp);
                                  return (
                                    <div key={`${row.timestamp}-${row.id ?? idx}`} className="grid gap-1">
                                      <div
                                        className={`flex items-center gap-2 text-[11px] text-muted-foreground ${
                                          isUser ? "justify-end" : "justify-start"
                                        }`}
                                        title={row.timestamp}
                                      >
                                        <span
                                          className={`rounded-full border px-2 py-0.5 ${
                                            isUser
                                              ? "border-foreground/10 bg-foreground text-background"
                                              : "bg-background"
                                          }`}
                                        >
                                          {who}
                                        </span>
                                        <span className="whitespace-nowrap">
                                          {ts.date} {ts.time}
                                        </span>
                                      </div>

                                      <div
                                        className={`flex ${
                                          isUser ? "justify-end" : "justify-start"
                                        }`}
                                      >
                                        <div
                                          className={`max-w-[44rem] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                                            isUser
                                              ? "border-foreground/10 bg-foreground text-background"
                                              : "bg-background"
                                          }`}
                                        >
                                          <p className="whitespace-pre-wrap">{row.message}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })
              : conversations.map((conv) => {
                  const last = conv.rows[conv.rows.length - 1];
                  const { date, time } = formatTimestamp(
                    last?.timestamp || conv.lastTimestamp,
                  );
                  const name = conv.visitorName?.trim() || "Unknown";
                  return (
                    <AccordionItem key={conv.conversationId} value={conv.conversationId}>
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex w-full flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border bg-background px-2 py-0.5 text-xs">
                              {name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              visitor #{conv.visitorId.slice(0, 8)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              conv #{conv.conversationId.slice(0, 8)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{conv.rows.length} msgs</span>
                            <span className="whitespace-nowrap">
                              {date} {time}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4">
                        <div className="grid gap-3">
                          {conv.rows.map((row, idx) => {
                            const isUser = row.role === "user";
                            const who = isUser ? name : "kasi";
                            const ts = formatTimestamp(row.timestamp);

                            return (
                              <div key={`${row.timestamp}-${row.id ?? idx}`} className="grid gap-1">
                                <div
                                  className={`flex items-center gap-2 text-[11px] text-muted-foreground ${
                                    isUser ? "justify-end" : "justify-start"
                                  }`}
                                  title={row.timestamp}
                                >
                                  <span
                                    className={`rounded-full border px-2 py-0.5 ${
                                      isUser
                                        ? "border-foreground/10 bg-foreground text-background"
                                        : "bg-background"
                                    }`}
                                  >
                                    {who}
                                  </span>
                                  <span className="whitespace-nowrap">
                                    {ts.date} {ts.time}
                                  </span>
                                </div>

                                <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                  <div
                                    className={`max-w-[44rem] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                                      isUser
                                        ? "border-foreground/10 bg-foreground text-background"
                                        : "bg-background"
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap">{row.message}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
          </Accordion>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-rose-600">Danger zone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Resetting deletes all stored chat logs in the Google Sheet and removes any dropdown validations.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="rounded-md border border-rose-500/30 bg-background px-3 py-2 text-sm text-rose-600"
                disabled={isResetting || data?.storage !== "webhook"}
                title={
                  data?.storage !== "webhook"
                    ? "Reset is only available when using Google Sheets"
                    : "Deletes all rows in the Google Sheet and recreates clean headers"
                }
              >
                {isResetting ? "Resetting…" : "Reset sheet"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Google Sheet logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all rows in the configured sheet and recreate a clean header row.
                  To confirm, type <span className="font-semibold">RESET</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-2 grid gap-1">
                <label className="text-xs text-muted-foreground">Confirmation</label>
                <input
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={resetText}
                  onChange={(e) => setResetText(e.target.value)}
                  placeholder="Type RESET"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isResetting}
                  onClick={() => setResetText("")}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isResetting || resetText.trim() !== "RESET"}
                  onClick={(e) => {
                    e.preventDefault();
                    resetSheet();
                    setResetText("");
                  }}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </main>
  );
}
