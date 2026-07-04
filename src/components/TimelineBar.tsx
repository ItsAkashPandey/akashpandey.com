"use client";

import { cn } from "@/lib/utils";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
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
  month: string;
  monthLong: string;
  monthIndex: number;
  year: number;
  count: number;
};

type YearGroup = {
  year: number;
  firstId: string;
  count: number;
  months: MonthStop[];
};

function buildTimeline(entries: TimelineEntry[]) {
  const groups: YearGroup[] = [];
  const entryToMonth = new Map<string, MonthStop>();

  for (const entry of entries) {
    const date = new Date(`${entry.date}T12:00:00`);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    let yearGroup = groups.find((group) => group.year === year);

    if (!yearGroup) {
      yearGroup = {
        year,
        firstId: entry.id,
        count: 0,
        months: [],
      };
      groups.push(yearGroup);
    }

    let month = yearGroup.months.find(
      (candidate) => candidate.monthIndex === monthIndex,
    );
    if (!month) {
      month = {
        id: entry.id,
        entryIds: [],
        month: date.toLocaleDateString("en-US", { month: "short" }),
        monthLong: date.toLocaleDateString("en-US", { month: "long" }),
        monthIndex,
        year,
        count: 0,
      };
      yearGroup.months.push(month);
    }

    month.entryIds.push(entry.id);
    month.count += 1;
    yearGroup.count += 1;
    entryToMonth.set(entry.id, month);
  }

  return { groups, entryToMonth };
}

function getClosestEntryId(entries: TimelineEntry[]) {
  const targetY = window.innerHeight * 0.34;
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

  return closestId;
}

export default function TimelineBar({ entries, onSelectEntry }: Props) {
  const { groups, entryToMonth } = useMemo(
    () => buildTimeline(entries),
    [entries],
  );
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const [displayYear, setDisplayYear] = useState(groups[0]?.year ?? 0);
  const monthRailRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef(new Map<string, HTMLButtonElement>());
  const yearRefs = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    const nextId = entries.some((entry) => entry.id === activeId)
      ? activeId
      : (entries[0]?.id ?? "");
    setActiveId(nextId);

    const activeMonth = entryToMonth.get(nextId);
    if (activeMonth) setDisplayYear(activeMonth.year);
  }, [activeId, entries, entryToMonth]);

  const selectEntry = useCallback(
    (id: string) => {
      if (onSelectEntry) {
        onSelectEntry(id);
        return;
      }

      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [onSelectEntry],
  );

  useEffect(() => {
    if (!entries.length) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextId = getClosestEntryId(entries);
        if (nextId) setActiveId(nextId);
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
  }, [entries]);

  const activeMonth = entryToMonth.get(activeId);
  const activeYear = activeMonth?.year ?? displayYear;
  const displayedGroup =
    groups.find((group) => group.year === displayYear) ?? groups[0];

  useEffect(() => {
    if (!activeMonth) return;
    setDisplayYear(activeMonth.year);

    requestAnimationFrame(() => {
      yearRefs.current.get(activeMonth.year)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      monthRefs.current.get(activeMonth.id)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  }, [activeMonth]);

  if (!groups.length || !displayedGroup) return null;

  const displayedMonthIndex = Math.max(
    0,
    displayedGroup.months.findIndex((month) => month.id === activeMonth?.id),
  );
  const monthProgress =
    displayedGroup.months.length <= 1
      ? 1
      : (displayedMonthIndex + 1) / displayedGroup.months.length;

  return (
    <section
      aria-label="Activity timeline"
      className="border-border/60 bg-background/90 supports-[backdrop-filter]:bg-background/76 sticky top-[73px] z-30 overflow-hidden rounded-[22px] border shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
    >
      <div className="border-border/50 flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="bg-foreground text-background grid size-8 shrink-0 place-items-center rounded-xl">
            <CalendarRange className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase">
              Time navigator
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {activeMonth
                ? `${activeMonth.monthLong} ${activeMonth.year}`
                : "Swipe or choose a period"}
            </p>
          </div>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[10px] font-semibold tabular-nums">
          {entries.length} moments
        </span>
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2">
          <span className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
            Year
          </span>
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groups.map((group) => {
              const isActive = group.year === activeYear;
              const isDisplayed = group.year === displayYear;

              return (
                <button
                  key={group.year}
                  ref={(node) => {
                    if (node) yearRefs.current.set(group.year, node);
                    else yearRefs.current.delete(group.year);
                  }}
                  type="button"
                  onClick={() => {
                    setDisplayYear(group.year);
                    selectEntry(group.firstId);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums transition-all",
                    isDisplayed
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isActive && !isDisplayed && "ring-foreground/20 ring-1",
                  )}
                  aria-current={isActive ? "date" : undefined}
                >
                  {group.year}
                  <span className="ml-1.5 opacity-55">{group.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2">
          <span className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
            Month
          </span>
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() =>
                monthRailRef.current?.scrollBy({
                  left: -220,
                  behavior: "smooth",
                })
              }
              className="border-border/60 bg-background absolute top-1/2 left-0 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border shadow-sm"
              aria-label="Earlier months"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <div
              ref={monthRailRef}
              className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {displayedGroup.months.map((month) => {
                const isActive = month.id === activeMonth?.id;
                return (
                  <button
                    key={month.id}
                    ref={(node) => {
                      if (node) monthRefs.current.set(month.id, node);
                      else monthRefs.current.delete(month.id);
                    }}
                    type="button"
                    onClick={() => selectEntry(month.id)}
                    className={cn(
                      "group/month relative min-w-[88px] snap-center rounded-xl border px-3 py-2 text-left transition-all",
                      isActive
                        ? "border-foreground/30 bg-foreground/[0.06] shadow-sm"
                        : "border-border/55 bg-background/60 hover:border-border hover:bg-muted/55",
                    )}
                    aria-current={isActive ? "date" : undefined}
                  >
                    <span
                      className={cn(
                        "block text-xs font-semibold",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover/month:text-foreground",
                      )}
                    >
                      {month.month}
                    </span>
                    <span className="text-muted-foreground/75 mt-0.5 block text-[10px]">
                      {month.count} {month.count === 1 ? "event" : "events"}
                    </span>
                    <span
                      className={cn(
                        "absolute top-2 right-2 size-1.5 rounded-full transition",
                        isActive ? "bg-emerald-500" : "bg-border",
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                monthRailRef.current?.scrollBy({
                  left: 220,
                  behavior: "smooth",
                })
              }
              className="border-border/60 bg-background absolute top-1/2 right-0 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border shadow-sm"
              aria-label="Later months"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-border/60 h-0.5 w-full">
        <div
          className="bg-foreground h-full origin-left transition-transform duration-300"
          style={{ transform: `scaleX(${monthProgress})` }}
        />
      </div>
    </section>
  );
}
