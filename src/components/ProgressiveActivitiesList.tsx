"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity } from "@/lib/schemas";
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
import {
  ArrowUpDown,
  CalendarDays,
  GraduationCap,
  Layers2,
  RotateCcw,
  Rocket,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((prev) =>
      Math.min(prev + BATCH_SIZE, filteredActivities.length),
    );
    // Let TimelineBar recalculate sizes after DOM settles
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
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "800px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const timelineEntries = useMemo(
    () =>
      filteredActivities.map((activity) => ({
        id: activity.elementId,
        date: activity.date,
      })),
    [filteredActivities],
  );

  return (
    <div className="relative flex flex-col gap-8">
      <section className="border-border/60 bg-background/85 supports-[backdrop-filter]:bg-background/70 z-30 rounded-2xl border p-3 shadow-sm backdrop-blur-2xl sm:p-4 lg:sticky lg:top-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {filteredActivities.length} activit
              {filteredActivities.length === 1 ? "y" : "ies"} found
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
              disabled={!isFiltered}
              className="text-muted-foreground hover:text-foreground h-10 rounded-xl px-3 sm:w-auto"
            >
              <RotateCcw className="size-4" />
              <span>Reset</span>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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
                      "group bg-background/75 flex min-h-[78px] items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
                      selectedType === type
                        ? "border-foreground/30 ring-foreground/10 ring-2"
                        : "border-border/60 hover:border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
                        config.soft,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm leading-tight font-semibold">
                        {config.label}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {count} item{count === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div className="grid items-end gap-3 lg:grid-cols-[minmax(280px,1fr)_140px_160px]">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label
                htmlFor="activity-search"
                className="text-muted-foreground px-1 text-[11px] font-medium"
              >
                Search
              </Label>
              <div className="relative min-w-0">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Search className="text-muted-foreground size-4" />
                </span>
                <Input
                  id="activity-search"
                  type="search"
                  placeholder="Search activities..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="border-border/60 bg-background/70 h-11 rounded-xl pl-11 text-sm shadow-none"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label
                htmlFor="activity-year-filter"
                className="text-muted-foreground px-1 text-[11px] font-medium"
              >
                Year
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger
                  id="activity-year-filter"
                  className="border-border/60 bg-background/70 h-11 rounded-xl shadow-none"
                >
                  <CalendarDays className="text-muted-foreground mr-2 size-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
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
                className="text-muted-foreground px-1 text-[11px] font-medium"
              >
                Sort
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as ActivitySort)}
              >
                <SelectTrigger
                  id="activity-sort-filter"
                  className="border-border/60 bg-background/70 h-11 rounded-xl shadow-none"
                >
                  <ArrowUpDown className="text-muted-foreground mr-2 size-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 flex flex-col gap-8">
        {filteredActivities.length === 0 ? (
          <div className="border-border/70 bg-background/60 text-muted-foreground rounded-3xl border border-dashed px-6 py-16 text-center text-sm">
            No activities found matching your filters.
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <LazyActivity
              key={activity.elementId}
              activity={activity}
              index={index}
              initiallyVisible={index < visibleCount}
              searchQuery={query.trim()}
            />
          ))
        )}

        {filteredActivities.length > 0 && hasMore ? (
          <div ref={sentinelRef} className="h-16" aria-hidden="true" />
        ) : filteredActivities.length > 0 ? (
          /* End-of-list indicator */
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="from-primary/20 h-12 w-px bg-gradient-to-b to-transparent" />
            <p className="text-muted-foreground/60 text-xs font-medium tracking-widest uppercase">
              You&apos;ve seen it all ✨
            </p>
          </div>
        ) : null}
      </section>

      {filteredActivities.length > 0 && (
        <TimelineBar entries={timelineEntries} />
      )}
    </div>
  );
}
