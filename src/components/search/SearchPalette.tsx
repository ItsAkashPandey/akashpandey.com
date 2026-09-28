"use client";

import { useChatbot } from "@/contexts/ChatContext";
import type { SearchEntry } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command, defaultFilter } from "cmdk";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Compass,
  Copy,
  MessageCircle,
  SunMoon,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const EMAIL = "akash_k@ce.iitr.ac.in";
const THEMES = ["light", "dark", "system"] as const;

type Match = { value: string; keywords?: string[] };

/** What each quick action matches on. */
const ACTIONS = {
  kasi: {
    value: "Ask Kasi, the chat about Akash",
    keywords: ["chat", "question", "assistant"],
  },
  theme: {
    value: "Switch theme",
    keywords: ["dark", "light", "mode", "colour"],
  },
  email: { value: "Copy email address", keywords: ["mail", "contact", EMAIL] },
} satisfies Record<string, Match>;
type ActionId = keyof typeof ACTIONS;

const entryMatch = (entry: SearchEntry): Match => ({
  value: `${entry.title} ${entry.detail}`,
  keywords: entry.keywords,
});

/**
 * The palette filters and orders its own results, with cmdk's scoring, and
 * leaves cmdk the keyboard. cmdk 1.1.1 sorts by moving DOM nodes as the
 * query changes, before the items that only now match have rendered, so a
 * pasted query listed those in file order; and its group sorting never finds
 * the groups, so Enter on "Vienna" opened the home page.
 */
function rank<T>(items: T[], query: string, match: (item: T) => Match) {
  const scored = items.map((item) => {
    const { value, keywords } = match(item);
    return { item, score: query ? defaultFilter(value, query, keywords) : 1 };
  });
  return query
    ? scored.filter(({ score }) => score > 0).sort((a, b) => b.score - a.score)
    : scored;
}

const GROUP_ICONS: Record<SearchEntry["group"], LucideIcon> = {
  Pages: Compass,
  Activities: CalendarDays,
  Publications: BookOpen,
  Skills: Wrench,
  Experience: Briefcase,
};

let indexRequest: Promise<SearchEntry[]> | null = null;

/** Fetched the first time the palette opens, then kept for the visit. */
function loadIndex() {
  indexRequest ??= fetch("/search-index.json")
    .then((response) => {
      if (!response.ok) throw new Error(`search index ${response.status}`);
      return response.json() as Promise<SearchEntry[]>;
    })
    .catch((error) => {
      indexRequest = null;
      throw error;
    });
  return indexRequest;
}

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm outline-none select-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground";

export default function SearchPalette({
  open,
  onOpenChange,
  shortcut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "⌘K" or "Ctrl K", whichever this keyboard has. */
  shortcut: string;
}) {
  const router = useRouter();
  const { setIsOpen: setChatOpen } = useChatbot();
  const { theme, setTheme } = useTheme();
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || entries) return;
    let active = true;
    loadIndex()
      .then((data) => active && setEntries(data))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [open, entries]);

  // A fresh search each time it opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setCopied(false);
    }
  }, [open]);

  const go = (entry: SearchEntry) => {
    onOpenChange(false);
    if (entry.href.endsWith(".pdf")) {
      window.open(entry.href, "_blank", "noopener");
    } else {
      router.push(entry.href);
    }
  };

  const nextTheme =
    THEMES[(THEMES.indexOf((theme as (typeof THEMES)[number]) ?? "system") + 1) % THEMES.length];

  // Quick actions (group: null) and the groups, each holding only what
  // matches, best match first. The sort is stable, so with nothing typed
  // everything keeps its fixed order.
  const sections = useMemo(
    () =>
      [
        {
          group: null,
          results: rank(
            Object.keys(ACTIONS) as ActionId[],
            query,
            (id) => ACTIONS[id],
          ),
        },
        ...(Object.keys(GROUP_ICONS) as SearchEntry["group"][]).map(
          (group) => ({
            group,
            results: rank(
              entries?.filter((entry) => entry.group === group) ?? [],
              query,
              entryMatch,
            ),
          }),
        ),
      ]
        .filter(({ results }) => results.length > 0)
        .sort((a, b) => b.results[0].score - a.results[0].score),
    [entries, query],
  );

  const actionItems: Record<ActionId, ReactNode> = {
    kasi: (
      <Command.Item
        key="kasi"
        {...ACTIONS.kasi}
        onSelect={() => {
          onOpenChange(false);
          setChatOpen(true);
        }}
        className={itemClass}
      >
        <MessageCircle className="text-tone-teal size-4 shrink-0" aria-hidden />
        <span>Ask Kasi</span>
      </Command.Item>
    ),
    theme: (
      <Command.Item
        key="theme"
        {...ACTIONS.theme}
        onSelect={() => setTheme(nextTheme)}
        className={itemClass}
      >
        <SunMoon className="text-tone-amber size-4 shrink-0" aria-hidden />
        <span>Switch theme</span>
        <span className="text-muted-foreground ml-auto text-xs">
          to {nextTheme}
        </span>
      </Command.Item>
    ),
    email: (
      <Command.Item
        key="email"
        {...ACTIONS.email}
        onSelect={() => {
          void navigator.clipboard
            ?.writeText(EMAIL)
            .then(() => setCopied(true));
        }}
        className={itemClass}
      >
        <Copy className="text-tone-sky size-4 shrink-0" aria-hidden />
        <span>Copy email address</span>
        <span
          className="text-muted-foreground ml-auto text-xs"
          aria-live="polite"
        >
          {copied ? "Copied" : EMAIL}
        </span>
      </Command.Item>
    ),
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-foreground/25 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[70] backdrop-blur-[2px] motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="bg-card border-border data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 fixed top-3 left-1/2 z-[71] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border shadow-[0_1px_2px_hsl(var(--foreground)/0.08),0_24px_60px_-20px_hsl(var(--foreground)/0.4)] motion-reduce:animate-none sm:top-[12vh]"
        >
          <DialogPrimitive.Title className="sr-only">Search the site</DialogPrimitive.Title>
          <Command
            label="Search the site"
            loop
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:text-muted-foreground flex flex-col [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold"
          >
            <div className="border-border/70 flex items-center gap-2 border-b px-3">
              <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search activities, papers, tools…"
                className="ios-prevent-zoom placeholder:text-muted-foreground h-12 w-full bg-transparent text-sm outline-none"
              />
              <kbd className="text-muted-foreground border-border hidden rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline">
                Esc
              </kbd>
            </div>

            <Command.List className="max-h-[60dvh] overflow-y-auto overscroll-contain p-1.5 sm:max-h-[min(60vh,28rem)]">
              {!entries && !failed && (
                <Command.Loading>
                  <p className="text-muted-foreground px-3 py-6 text-center text-sm">Loading…</p>
                </Command.Loading>
              )}
              {failed && (
                <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                  Search couldn&apos;t load. Check your connection and try again.
                </p>
              )}
              <Command.Empty className="text-muted-foreground px-3 py-6 text-center text-sm">
                Nothing matches “{query}”.
              </Command.Empty>

              {sections.map((section) => {
                if (section.group === null) {
                  return (
                    <Command.Group key="actions" heading="Quick actions">
                      {section.results.map(({ item }) => actionItems[item])}
                    </Command.Group>
                  );
                }
                const Icon = GROUP_ICONS[section.group];
                return (
                  <Command.Group key={section.group} heading={section.group}>
                    {section.results.map(({ item: entry }) => (
                      <Command.Item
                        key={`${entry.href}-${entry.title}`}
                        {...entryMatch(entry)}
                        onSelect={() => go(entry)}
                        className={cn(itemClass, "items-start")}
                      >
                        <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{entry.title}</span>
                          <span className="text-muted-foreground truncate text-xs">
                            {entry.detail}
                          </span>
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>

            <div className="border-border/70 text-muted-foreground hidden items-center gap-4 border-t px-3 py-2 text-[11px] sm:flex">
              <span>
                <kbd className="font-sans">↑↓</kbd> to move
              </span>
              <span>
                <kbd className="font-sans">↵</kbd> to open
              </span>
              <span className="ml-auto">
                <kbd className="font-sans">/</kbd> or <kbd className="font-sans">{shortcut}</kbd> from anywhere
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
