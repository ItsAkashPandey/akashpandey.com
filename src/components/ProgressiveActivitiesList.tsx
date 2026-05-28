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
  Layers2,
  RotateCcw,
  Search,
} from "lucide-react";

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
      <div className="border-border/50 bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-16 z-30 rounded-[1.75rem] border p-3 shadow-sm backdrop-blur-2xl sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search activities..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="border-border/60 bg-background/70 h-11 rounded-2xl pl-9 text-sm shadow-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:shrink-0">
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
                    className="border-border/60 bg-background/70 h-11 rounded-2xl shadow-none lg:w-[132px]"
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
                    className="border-border/60 bg-background/70 h-11 rounded-2xl shadow-none lg:w-[150px]"
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

              <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
                <Label
                  htmlFor="activity-type-filter"
                  className="text-muted-foreground px-1 text-[11px] font-medium"
                >
                  Type
                </Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) =>
                    setSelectedType(value as ActivityTypeFilter)
                  }
                >
                  <SelectTrigger
                    id="activity-type-filter"
                    className="border-border/60 bg-background/70 h-11 rounded-2xl shadow-none lg:w-[150px]"
                  >
                    <Layers2 className="text-muted-foreground mr-2 size-4 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Type</SelectItem>
                    <SelectItem value="academics">Academics</SelectItem>
                    <SelectItem value="startups">Startups</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-col justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  disabled={!isFiltered}
                  className="text-muted-foreground hover:text-foreground h-11 rounded-2xl px-3"
                >
                  <RotateCcw className="size-4" />
                  <span className="sr-only sm:not-sr-only">Reset</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center justify-between gap-3 px-1 text-xs">
            <span>
              {filteredActivities.length} activit
              {filteredActivities.length === 1 ? "y" : "ies"} found
            </span>
            <span className="hidden sm:inline">
              All years, newest first, all type by default
            </span>
          </div>
        </div>
      </div>

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
