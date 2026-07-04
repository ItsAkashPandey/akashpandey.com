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
      className="pointer-events-none fixed top-24 right-1 bottom-8 z-40 hidden w-[92px] lg:block"
    >
      <div className="pointer-events-auto relative h-full overflow-hidden rounded-[20px] border border-white/8 bg-zinc-950/88 shadow-[0_18px_50px_rgba(2,6,23,.28)] backdrop-blur-xl dark:bg-black/78">
        <div
          ref={trackRef}
          className="absolute inset-y-4 right-3 left-2 cursor-ns-resize touch-none select-none"
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
        >
          <span className="absolute top-0 right-[6px] bottom-0 w-px bg-white/12" />

          {years.map((year, index) => {
            const isActive = year.year === activeYear;
            const height = Math.max(5, year.end - year.start);

            return (
              <div
                key={year.year}
                className={cn(
                  "absolute right-0 left-0 rounded-md transition-colors duration-300",
                  isActive
                    ? "bg-white/[0.075]"
                    : index % 2 === 0
                      ? "bg-white/[0.018]"
                      : "bg-transparent",
                )}
                style={{ top: `${year.start}%`, height: `${height}%` }}
              >
                <button
                  type="button"
                  onClick={() => selectEntry(year.firstId)}
                  className={cn(
                    "absolute top-1/2 right-3 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition",
                    isActive
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "bg-black/42 text-white/66 hover:bg-white/12 hover:text-white",
                  )}
                  aria-current={isActive ? "date" : undefined}
                >
                  {year.year}
                </button>
              </div>
            );
          })}

          {stops.map((stop) => (
            <button
              key={`${stop.year}-${stop.shortLabel}`}
              type="button"
              onClick={() => selectEntry(stop.id)}
              aria-label={`Go to ${stop.label}`}
              title={stop.label}
              className={cn(
                "absolute right-[4px] z-10 size-[5px] -translate-y-1/2 rounded-full transition-all",
                stop === activeStop
                  ? "scale-150 bg-sky-300 ring-2 ring-sky-300/20"
                  : "bg-white/24 hover:scale-150 hover:bg-white/70",
              )}
              style={{ top: `${stop.position}%` }}
            />
          ))}

          {activeStop && (
            <motion.div
              className="pointer-events-none absolute right-[2px] left-0 z-20 -translate-y-1/2"
              animate={{ top: `${activeStop.position}%` }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
            >
              <span className="absolute top-1/2 right-0 h-px w-5 bg-sky-300" />
              <span className="absolute top-1/2 right-[17px] -translate-y-1/2 rounded-[7px] bg-zinc-900 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-white shadow-lg ring-1 ring-white/10">
                {activeStop.label}
              </span>
            </motion.div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>
    </aside>
  );
}
