"use client";

import { Activity } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  CalendarDays,
  GraduationCap,
  Layers2,
  RotateCcw,
  Rocket,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LazyActivity from "./LazyActivity";
import TimelineBar from "./TimelineBar";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type ActivityWithMeta = Activity & {
  elementId: string;
  resolvedImages: string[];
};
type ActivitySort = "newest" | "oldest";
type ActivityTypeFilter = "all" | "academics" | "startups";

interface Props {
  allActivities: ActivityWithMeta[];
  initialVisibleCount: number;
}

const BATCH_SIZE = 3;
const STARTUP_KEYWORDS = [
  "100 startups",
  "aabtonics",
  "bhoomicam",
  "dronagiri",
  "nasscom",
  "startup",
  "tides",
];

const activityTypeStyles = {
  all: {
    label: "All activities",
    Icon: Layers2,
    soft: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  academics: {
    label: "Academics",
    Icon: GraduationCap,
    soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  startups: {
    label: "Startups",
    Icon: Rocket,
    soft: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
} satisfies Record<
  ActivityTypeFilter,
  {
    label: string;
    Icon: typeof Layers2;
    soft: string;
  }
>;

function scrollToRenderedActivity(
  id: string,
  behavior: ScrollBehavior = "smooth",
  attempt = 0,
) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior, block: "center" });
    return;
  }

  if (attempt < 12) {
    requestAnimationFrame(() =>
      scrollToRenderedActivity(id, behavior, attempt + 1),
    );
  }
}

function getActivityType(
  activity: ActivityWithMeta,
): Exclude<ActivityTypeFilter, "all"> {
  const searchableText = [
    activity.name,
    activity.description,
    activity.imageFolder ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return STARTUP_KEYWORDS.some((keyword) => searchableText.includes(keyword))
    ? "startups"
    : "academics";
}

export default function ProgressiveActivitiesList({
  allActivities,
  initialVisibleCount = 5,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortBy, setSortBy] = useState<ActivitySort>("newest");
  const [selectedType, setSelectedType] = useState<ActivityTypeFilter>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          allActivities.map((activity) =>
            new Date(activity.date).getFullYear(),
          ),
        ),
      ).sort((a, b) => b - a),
    [allActivities],
  );

  const activityTypeCounts = useMemo(() => {
    return allActivities.reduce(
      (counts, activity) => {
        counts[getActivityType(activity)]++;
        return counts;
      },
      { academics: 0, startups: 0 },
    );
  }, [allActivities]);

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allActivities
      .filter((activity) => {
        const activityType = getActivityType(activity);
        const activityYear = new Date(activity.date).getFullYear().toString();
        const haystack = [
          activity.name,
          activity.description,
          activity.location ?? "",
          activity.date,
          activityType,
        ]
          .join(" ")
          .toLowerCase();

        if (normalizedQuery && !haystack.includes(normalizedQuery)) {
          return false;
        }
        if (selectedYear !== "all" && activityYear !== selectedYear) {
          return false;
        }
        if (selectedType !== "all" && activityType !== selectedType) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [allActivities, query, selectedYear, selectedType, sortBy]);

  const hasMore = visibleCount < filteredActivities.length;
  const visibleActivities = useMemo(
    () => filteredActivities.slice(0, visibleCount),
    [filteredActivities, visibleCount],
  );
  const isFiltered =
    query.trim() !== "" ||
    selectedYear !== "all" ||
    selectedType !== "all" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setQuery("");
    setSelectedYear("all");
    setSelectedType("all");
    setSortBy("newest");
  };

  useEffect(() => {
    const revealHashTarget = () => {
      const match = window.location.hash.match(/^#activity-(\d+)$/);
      if (!match) return;

      const index = Number(match[1]);
      if (!Number.isFinite(index)) return;

      setVisibleCount((current) =>
        Math.max(current, Math.min(index + 1, filteredActivities.length)),
      );
      scrollToRenderedActivity(`activity-${index}`, "smooth");
    };

    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);
    return () => window.removeEventListener("hashchange", revealHashTarget);
  }, [filteredActivities.length]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((previous) =>
      Math.min(previous + BATCH_SIZE, filteredActivities.length),
    );
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("timeline-measure"));
    });
  }, [hasMore, filteredActivities.length]);

  useEffect(() => {
    setVisibleCount(initialVisibleCount);
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("timeline-measure"));
    });
  }, [initialVisibleCount, query, selectedYear, selectedType, sortBy]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "800px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    if (!hasMore) return;

    const handleScroll = () => {
      const remaining =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      if (remaining < 900) loadMore();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadMore]);

  const timelineEntries = useMemo(
    () =>
      filteredActivities.map((activity) => ({
        id: activity.elementId,
        date: activity.date,
      })),
    [filteredActivities],
  );

  const selectTimelineEntry = useCallback(
    (id: string) => {
      const index = filteredActivities.findIndex(
        (activity) => activity.elementId === id,
      );
      if (index < 0) return;

      setVisibleCount((current) =>
        Math.max(current, Math.min(index + 1, filteredActivities.length)),
      );
      scrollToRenderedActivity(id);
    },
    [filteredActivities],
  );

  return (
    <div className="relative grid min-w-0 gap-5 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-8">
      <aside className="border-border/60 bg-background/88 supports-[backdrop-filter]:bg-background/72 rounded-[24px] border p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-2xl lg:sticky lg:top-24 lg:col-start-1 lg:row-start-1">
        <div className="border-border/50 mb-4 flex items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              <h2 className="text-sm font-semibold">Explore</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {filteredActivities.length} activit
              {filteredActivities.length === 1 ? "y" : "ies"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            disabled={!isFiltered}
            className="text-muted-foreground hover:text-foreground size-9 rounded-xl"
            title="Reset filters"
          >
            <RotateCcw className="size-3.5" />
            <span className="sr-only">Reset filters</span>
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label
              htmlFor="activity-search"
              className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.12em] uppercase"
            >
              Search
            </Label>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <Search className="text-muted-foreground size-3.5" />
              </span>
              <Input
                id="activity-search"
                type="search"
                placeholder="Topic or place"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="border-border/60 bg-background/70 h-10 rounded-xl pl-10 text-sm shadow-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
              Focus
            </p>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              {(["all", "academics", "startups"] as ActivityTypeFilter[]).map(
                (type) => {
                  const config = activityTypeStyles[type];
                  const Icon = config.Icon;
                  const count =
                    type === "all"
                      ? allActivities.length
                      : activityTypeCounts[type];

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "group flex min-w-0 items-center gap-2.5 rounded-xl border p-2 text-left transition-all",
                        selectedType === type
                          ? "border-foreground/25 bg-foreground/[0.055] shadow-sm"
                          : "hover:border-border/70 hover:bg-muted/55 border-transparent",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          config.soft,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="hidden min-w-0 lg:block">
                        <span className="block truncate text-xs font-semibold">
                          {config.label}
                        </span>
                        <span className="text-muted-foreground block text-[10px]">
                          {count} items
                        </span>
                      </span>
                      <span className="truncate text-[10px] font-semibold lg:hidden">
                        {type === "all"
                          ? "All"
                          : type === "academics"
                            ? "Academic"
                            : "Startup"}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label
                htmlFor="activity-year-filter"
                className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.12em] uppercase"
              >
                Year
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger
                  id="activity-year-filter"
                  className="border-border/60 bg-background/70 h-10 w-full rounded-xl shadow-none"
                >
                  <CalendarDays className="text-muted-foreground mr-2 size-3.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label
                htmlFor="activity-sort-filter"
                className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.12em] uppercase"
              >
                Order
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as ActivitySort)}
              >
                <SelectTrigger
                  id="activity-sort-filter"
                  className="border-border/60 bg-background/70 h-10 w-full rounded-xl shadow-none"
                >
                  <ArrowUpDown className="text-muted-foreground mr-2 size-3.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </aside>

      {filteredActivities.length > 0 && (
        <TimelineBar
          entries={timelineEntries}
          onSelectEntry={selectTimelineEntry}
        />
      )}

      <div className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-1 lg:pr-12 xl:pr-8">
        <section className="relative z-10 flex min-w-0 flex-col gap-6">
          {filteredActivities.length === 0 ? (
            <div className="border-border/70 bg-background/60 text-muted-foreground rounded-3xl border border-dashed px-6 py-16 text-center text-sm">
              No activities found matching your filters.
            </div>
          ) : (
            visibleActivities.map((activity, index) => (
              <LazyActivity
                key={activity.elementId}
                activity={activity}
                index={index}
                initiallyVisible
                searchQuery={query.trim()}
              />
            ))
          )}

          {filteredActivities.length > 0 && hasMore ? (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <Button
                type="button"
                variant="outline"
                onClick={loadMore}
                className="rounded-xl"
              >
                Load more
              </Button>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="from-primary/20 h-12 w-px bg-gradient-to-b to-transparent" />
              <p className="text-muted-foreground/60 text-xs font-medium tracking-widest uppercase">
                You&apos;ve reached the beginning
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
