"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface TimelineEntry {
  id: string;
  date: string;
}

interface Props {
  entries: TimelineEntry[];
  /** How many entries currently have a card in the DOM. */
  renderedCount: number;
  onSelectEntry: (id: string) => void;
}

type MonthStop = {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  /** 0-100, proportional to time between the first and last stop. */
  position: number;
};

type YearRange = {
  year: number;
  firstId: string;
  start: number;
  end: number;
};

function monthNumber(date: string) {
  return Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
}

function buildTimeline(entries: TimelineEntry[]) {
  const monthMap = new Map<number, Omit<MonthStop, "position">>();
  const entryToMonth = new Map<string, number>();

  for (const entry of entries) {
    const month = monthNumber(entry.date);
    entryToMonth.set(entry.id, month);
    if (monthMap.has(month)) continue;

    const date = new Date(`${entry.date}T12:00:00`);
    monthMap.set(month, {
      id: entry.id,
      label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      shortLabel: date.toLocaleDateString("en-US", { month: "short" }),
      year: date.getFullYear(),
    });
  }

  // Stops sit at their real distance in time, so a six-month gap is six times
  // longer than a one-month gap instead of the same size.
  const months = Array.from(monthMap.keys());
  const first = months[0] ?? 0;
  const span = (months[months.length - 1] ?? first) - first;
  const stops: MonthStop[] = months.map((month) => ({
    ...monthMap.get(month)!,
    position: span === 0 ? 0 : ((month - first) / span) * 100,
  }));

  const years: YearRange[] = [];
  for (const stop of stops) {
    const existing = years.find((item) => item.year === stop.year);
    if (existing) {
      existing.end = stop.position;
    } else {
      years.push({
        year: stop.year,
        firstId: stop.id,
        start: stop.position,
        end: stop.position,
      });
    }
  }

  for (let index = 0; index < years.length; index++) {
    const current = years[index];
    const previous = years[index - 1];
    const next = years[index + 1];
    current.start =
      previous === undefined ? 0 : (previous.end + current.start) / 2;
    current.end = next === undefined ? 100 : (current.end + next.start) / 2;
  }

  return { stops, years, entryToMonth, monthMap };
}

/**
 * A date scrubber for the activity list. It sits in its own grid column, so it
 * never covers a card, and follows the page with one IntersectionObserver
 * instead of measuring every card on every scroll frame.
 */
export default function TimelineBar({
  entries,
  renderedCount,
  onSelectEntry,
}: Props) {
  const { stops, years, entryToMonth, monthMap } = useMemo(
    () => buildTimeline(entries),
    [entries],
  );
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const [scrubbing, setScrubbing] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastScrubbedId = useRef("");

  const selectEntry = useCallback(
    (id: string) => {
      setActiveId(id);
      onSelectEntry(id);
    },
    [onSelectEntry],
  );

  // The active entry is the first card crossing a line 38% down the viewport.
  useEffect(() => {
    if (scrubbing) return;
    const crossing = new Set<string>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) crossing.add(record.target.id);
          else crossing.delete(record.target.id);
        }
        const current = entries.find((entry) => crossing.has(entry.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: "-38% 0px -61% 0px" },
    );
    for (const entry of entries.slice(0, renderedCount)) {
      const element = document.getElementById(entry.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [entries, renderedCount, scrubbing]);

  const activeMonth = monthMap.get(entryToMonth.get(activeId) ?? -1);
  const activeStop =
    stops.find((stop) => stop.id === activeMonth?.id) ?? stops[0];
  const activeYear = activeStop?.year;

  const scrubToPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track || !stops.length) return;

      const rect = track.getBoundingClientRect();
      const position =
        Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)) * 100;
      const stop = stops.reduce((closest, candidate) =>
        Math.abs(candidate.position - position) <
        Math.abs(closest.position - position)
          ? candidate
          : closest,
      );
      if (lastScrubbedId.current === stop.id) return;

      lastScrubbedId.current = stop.id;
      selectEntry(stop.id);
    },
    [selectEntry, stops],
  );

  if (!stops.length) return null;

  return (
    <div className="sticky top-24 hidden h-[calc(100dvh-8rem)] lg:block">
      <div
        ref={trackRef}
        role="slider"
        aria-label="Scrub activity dates"
        aria-valuetext={activeStop?.label}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, stops.length - 1)}
        aria-valuenow={Math.max(0, stops.indexOf(activeStop))}
        tabIndex={0}
        className="focus-visible:ring-ink/60 absolute inset-y-3 right-2 left-2 cursor-ns-resize touch-none rounded-sm outline-none select-none focus-visible:ring-2"
        onPointerDown={(event) => {
          setScrubbing(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          // A year label or a tick jumps to that exact entry; anywhere else
          // on the track picks the nearest one.
          const entry = (event.target as HTMLElement)
            .closest("[data-entry]")
            ?.getAttribute("data-entry");
          if (entry) selectEntry(entry);
          else scrubToPointer(event.clientY);
        }}
        onPointerMove={(event) => {
          if (scrubbing) scrubToPointer(event.clientY);
        }}
        onPointerUp={(event) => {
          setScrubbing(false);
          lastScrubbedId.current = "";
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          setScrubbing(false);
          lastScrubbedId.current = "";
        }}
        onKeyDown={(event) => {
          const currentIndex = Math.max(0, stops.indexOf(activeStop));
          if (event.key === "ArrowUp") {
            event.preventDefault();
            selectEntry(stops[Math.max(0, currentIndex - 1)].id);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            selectEntry(stops[Math.min(stops.length - 1, currentIndex + 1)].id);
          }
        }}
      >
        <span className="bg-border absolute top-0 right-[7px] bottom-0 w-px" />

        {years.map((year, index) => {
          const isActive = year.year === activeYear;
          const height = Math.max(4, year.end - year.start);

          return (
            <div
              key={year.year}
              className={cn(
                "absolute right-0 left-0 border-t transition-[background-color,border-color] duration-300",
                isActive
                  ? "border-ink/60 bg-ink/[0.08] shadow-[inset_2px_0_0_hsl(var(--accent-ink)/0.7)]"
                  : index % 2 === 0
                    ? "border-border/65"
                    : "border-border/45",
              )}
              style={{ top: `${year.start}%`, height: `${height}%` }}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0 right-[4px] h-px w-4",
                  isActive ? "bg-ink/80" : "bg-border",
                )}
              />
              {/* Marks, not buttons: the track itself is the slider, and
                  controls nested inside a slider confuse screen readers. */}
              <span
                aria-hidden
                data-entry={year.firstId}
                className={cn(
                  "absolute top-1/2 right-[17px] -translate-y-1/2 cursor-pointer rounded-sm px-1 py-0.5 text-[11px] font-bold tabular-nums transition-colors duration-200",
                  isActive
                    ? "bg-background/85 text-ink shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {year.year}
              </span>
            </div>
          );
        })}

        {stops.map((stop) => {
          const isActive = stop === activeStop;
          return (
            <span
              key={`${stop.year}-${stop.shortLabel}`}
              aria-hidden
              data-entry={stop.id}
              title={stop.label}
              className={cn(
                "absolute right-0 z-10 h-3 w-5 -translate-y-1/2 cursor-pointer before:absolute before:top-1/2 before:right-0 before:-translate-y-1/2 before:rounded-full before:transition-all before:duration-150",
                isActive
                  ? "before:bg-ink before:h-0.5 before:w-[18px] before:shadow-[0_0_0_3px_hsl(var(--accent-ink)/0.1)]"
                  : "before:bg-muted-foreground/35 hover:before:bg-foreground before:h-px before:w-2 hover:before:w-4",
              )}
              style={{ top: `${stop.position}%` }}
            />
          );
        })}

        {activeStop && (
          <motion.div
            className="pointer-events-none absolute right-[22px] z-20 flex -translate-y-1/2 items-center justify-end"
            animate={{ top: `${activeStop.position}%` }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
          >
            <span className="text-foreground border-ink block border-b px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap">
              {activeStop.shortLabel}
            </span>
            <span className="bg-ink h-px w-2" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
