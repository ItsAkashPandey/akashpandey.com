"use client";

import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface TimelineEntry {
  id: string;
  date: string;
}

interface Props {
  entries: TimelineEntry[];
  onSelectEntry?: (id: string) => void;
}

type TimelineStop = {
  id: string;
  label: string;
  month: string;
  year: number;
  dateText: string;
  count: number;
};

function toStop(entry: TimelineEntry): TimelineStop {
  const date = new Date(entry.date);
  return {
    id: entry.id,
    label: date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    month: date.toLocaleDateString("en-US", { month: "short" }),
    year: date.getFullYear(),
    dateText: date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    count: 1,
  };
}

function groupStops(entries: TimelineEntry[]) {
  const stops: TimelineStop[] = [];
  const entryToStopId = new Map<string, string>();

  for (const entry of entries) {
    const stop = toStop(entry);
    const previous = stops[stops.length - 1];
    if (previous && previous.label === stop.label) {
      previous.count += 1;
      entryToStopId.set(entry.id, previous.id);
      continue;
    }
    stops.push(stop);
    entryToStopId.set(entry.id, stop.id);
  }

  return { entryToStopId, stops };
}

function getClosestEntryId(entries: TimelineEntry[]) {
  const targetY = window.innerHeight * 0.38;
  let closestId = entries[0]?.id ?? "";
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    const element = document.getElementById(entry.id);
    if (!element) continue;

    const rect = element.getBoundingClientRect();
    const distance = Math.abs(rect.top - targetY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestId = entry.id;
    }
  }

  return closestId || entries[0]?.id || "";
}

export default function TimelineBar({ entries, onSelectEntry }: Props) {
  const { entryToStopId, stops } = useMemo(() => groupStops(entries), [entries]);
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");

  useEffect(() => {
    setActiveId((current) =>
      entries.some((entry) => entry.id === current)
        ? current
        : (entries[0]?.id ?? ""),
    );
  }, [entries]);

  const scrollToEntry = useCallback((id: string) => {
    if (onSelectEntry) {
      onSelectEntry(id);
      return;
    }

    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [onSelectEntry]);

  useEffect(() => {
    if (!entries.length) return;

    let frame = 0;

    const commitActive = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setActiveId(getClosestEntryId(entries));
      });
    };

    const handleScroll = () => commitActive();
    const handleResize = () => commitActive();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("timeline-measure", handleScroll);
    commitActive();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("timeline-measure", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [entries]);

  if (!stops.length) return null;

  const activeStopId = entryToStopId.get(activeId) ?? stops[0]?.id ?? "";
  const activeIndex = Math.max(
    0,
    stops.findIndex((stop) => stop.id === activeStopId),
  );
  const progress =
    stops.length <= 1 ? 0 : Math.min(1, activeIndex / (stops.length - 1));

  return (
    <aside
      aria-label="Activities timeline"
      className="fixed top-28 right-4 z-20 hidden w-[196px] lg:block"
    >
      <div className="border-border/60 bg-background/72 shadow-primary/5 rounded-2xl border p-3 shadow-xl backdrop-blur-2xl">
        <div className="text-muted-foreground mb-3 flex items-center gap-2 px-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
          <CalendarDays className="size-3.5" />
          Timeline
        </div>

        <div className="relative max-h-[calc(100vh-13rem)] overflow-hidden">
          <div className="bg-border/70 absolute top-2 bottom-2 left-[18px] w-px rounded-full" />
          <div
            className="from-primary to-primary/15 absolute top-2 left-[18px] w-px rounded-full bg-gradient-to-b"
            style={{
              height: `calc((100% - 1rem) * ${progress})`,
            }}
          />

          <nav className="relative flex flex-col gap-1">
            {stops.map((stop, index) => {
              const isActive = stop.id === activeStopId;
              const isPassed = index < activeIndex;

              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => scrollToEntry(stop.id)}
                  className={cn(
                    "group relative grid grid-cols-[38px_1fr] items-center rounded-xl py-1.5 pr-2 text-left transition-all duration-200",
                    isActive
                      ? "bg-primary/8"
                      : "hover:bg-muted/60 text-muted-foreground",
                  )}
                  title={stop.dateText}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className="relative flex h-7 items-center justify-center">
                    <span
                      className={cn(
                        "absolute z-10 rounded-full border transition-all duration-200",
                        isActive
                          ? "border-primary bg-primary size-3.5 shadow-[0_0_0_5px_hsl(var(--primary)/0.13)]"
                          : isPassed
                            ? "border-primary bg-primary/80 size-2.5"
                            : "border-border bg-background size-2.5",
                      )}
                    />
                  </span>

                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-xs font-semibold transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {stop.month}
                    </span>
                    <span className="text-muted-foreground/80 block truncate text-[10px]">
                      {stop.year}
                      {stop.count > 1 ? ` · ${stop.count}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
