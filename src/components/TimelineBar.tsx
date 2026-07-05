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
  onSelectEntry?: (id: string) => void;
}

type MonthStop = {
  id: string;
  entryIds: string[];
  label: string;
  shortLabel: string;
  year: number;
  position: number;
};

type YearRange = {
  year: number;
  firstId: string;
  start: number;
  end: number;
};

function closestEntry(entries: TimelineEntry[]) {
  const targetY = window.innerHeight * 0.38;
  let closestId = entries[0]?.id ?? "";
  let distance = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    const element = document.getElementById(entry.id);
    if (!element) continue;
    const nextDistance = Math.abs(
      element.getBoundingClientRect().top - targetY,
    );
    if (nextDistance < distance) {
      distance = nextDistance;
      closestId = entry.id;
    }
  }

  return closestId;
}

function buildTimeline(entries: TimelineEntry[]) {
  const monthMap = new Map<string, Omit<MonthStop, "position">>();
  const entryToMonthKey = new Map<string, string>();
  const orderedKeys: string[] = [];

  for (const entry of entries) {
    const date = new Date(`${entry.date}T12:00:00`);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    entryToMonthKey.set(entry.id, key);

    if (!monthMap.has(key)) {
      orderedKeys.push(key);
      monthMap.set(key, {
        id: entry.id,
        entryIds: [entry.id],
        label: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        shortLabel: date.toLocaleDateString("en-US", { month: "short" }),
        year: date.getFullYear(),
      });
    } else {
      monthMap.get(key)?.entryIds.push(entry.id);
    }
  }

  const denominator = Math.max(1, orderedKeys.length - 1);
  const stops = orderedKeys.map((key, index) => ({
    ...monthMap.get(key)!,
    position: (index / denominator) * 100,
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

  return { stops, years, entryToMonthKey, monthMap };
}

export default function TimelineBar({ entries, onSelectEntry }: Props) {
  const { stops, years, entryToMonthKey, monthMap } = useMemo(
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
      if (onSelectEntry) {
        onSelectEntry(id);
      } else {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [onSelectEntry],
  );

  useEffect(() => {
    if (!entries.length || scrubbing) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = closestEntry(entries);
        if (next) setActiveId(next);
      });
    };

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("timeline-measure", measure);
    measure();

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("timeline-measure", measure);
      cancelAnimationFrame(frame);
    };
  }, [entries, scrubbing]);

  const activeKey = entryToMonthKey.get(activeId);
  const activeMonth = activeKey ? monthMap.get(activeKey) : stops[0];
  const activeStop =
    stops.find(
      (stop) =>
        stop.year === activeMonth?.year &&
        stop.shortLabel === activeMonth?.shortLabel,
    ) ?? stops[0];
  const activeYear = activeStop?.year;

  const scrubToPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track || !stops.length) return;

      const rect = track.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientY - rect.top) / rect.height),
      );
      const index = Math.round(ratio * Math.max(0, stops.length - 1));
      const stop = stops[index];
      if (!stop || lastScrubbedId.current === stop.id) return;

      lastScrubbedId.current = stop.id;
      selectEntry(stop.id);
    },
    [selectEntry, stops],
  );

  if (!stops.length) return null;

  return (
    <aside
      aria-label="Activity date scrubber"
      className="pointer-events-none fixed top-24 right-1 bottom-28 z-40 hidden w-[94px] lg:block"
    >
      <div className="pointer-events-auto relative h-full w-full">
        <div
          ref={trackRef}
          role="slider"
          aria-label="Scrub activity dates"
          aria-valuetext={activeStop?.label}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, stops.length - 1)}
          aria-valuenow={Math.max(0, stops.indexOf(activeStop))}
          tabIndex={0}
          className="absolute inset-y-3 right-2 left-2 cursor-ns-resize touch-none outline-none select-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          onPointerDown={(event) => {
            setScrubbing(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            scrubToPointer(event.clientY);
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
              selectEntry(
                stops[Math.min(stops.length - 1, currentIndex + 1)].id,
              );
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
                  "absolute right-0 left-0 border-t transition-colors duration-300",
                  isActive
                    ? "border-sky-400/65"
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
                    isActive ? "bg-sky-400/80" : "bg-border",
                  )}
                />
                <button
                  type="button"
                  onClick={() => selectEntry(year.firstId)}
                  className={cn(
                    "absolute top-1/2 right-[17px] -translate-y-1/2 px-1 py-0.5 text-[10px] font-bold tabular-nums transition-colors duration-200",
                    isActive
                      ? "text-sky-600 dark:text-sky-300"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={isActive ? "date" : undefined}
                >
                  {year.year}
                </button>
              </div>
            );
          })}

          {stops.map((stop) => {
            const isActive = stop === activeStop;
            return (
              <button
                key={`${stop.year}-${stop.shortLabel}`}
                type="button"
                onClick={() => selectEntry(stop.id)}
                aria-label={`Go to ${stop.label}`}
                title={stop.label}
                className={cn(
                  "absolute right-0 z-10 h-3 w-5 -translate-y-1/2 before:absolute before:top-1/2 before:right-0 before:-translate-y-1/2 before:rounded-full before:transition-all before:duration-150",
                  isActive
                    ? "before:h-0.5 before:w-[18px] before:bg-sky-500 before:shadow-[0_0_0_3px_rgba(14,165,233,.10)]"
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
              <span className="text-foreground block border-b border-sky-500 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
                {activeStop.shortLabel}
              </span>
              <span className="h-px w-2 bg-sky-500" />
            </motion.div>
          )}
        </div>
      </div>
    </aside>
  );
}
