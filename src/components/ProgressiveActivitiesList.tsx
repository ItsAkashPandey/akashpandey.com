"use client";

import { activityYear } from "@/lib/content-utils";
import type { Photo } from "@/lib/photo";
import type { Activity, ActivityCategory } from "@/lib/schemas";
import {
  createSearchDocument,
  normalizeSearchText,
  scoreSearchDocument,
} from "@/lib/search";
import { useUrlFilters } from "@/lib/use-url-filters";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  CalendarDays,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityCard } from "./ActivityCard";
import { LegendIcon, PlateIcon, ShootIcon } from "./icons/FieldIcons";
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

export type ActivityListItem = Activity & { photos: Photo[] };

type Sort = "newest" | "oldest";
type Focus = "all" | ActivityCategory;
type Filters = { query: string; year: string; focus: Focus; sort: Sort };

const DEFAULT_FILTERS: Filters = {
  query: "",
  year: "all",
  focus: "all",
  sort: "newest",
};
const FILTER_KEYS = { query: "q", year: "year", focus: "focus", sort: "sort" };
const INITIAL_COUNT = 3;
const BATCH_SIZE = 3;

const focusOptions = {
  all: { label: "All activities", short: "All", Icon: LegendIcon, ink: "text-foreground/80" },
  academic: { label: "Academic", short: "Academic", Icon: PlateIcon, ink: "text-tone-green" },
  startup: { label: "Startup", short: "Startup", Icon: ShootIcon, ink: "text-tone-sky" },
} satisfies Record<Focus, { label: string; short: string; Icon: typeof LegendIcon; ink: string }>;

/**
 * The slug a hash points at. Also accepts the old `#activity-N` links (N was
 * the position in the newest-first list), so links already shared still land
 * on the activity they were copied from.
 */
export function slugFromHash(hash: string, activities: ActivityListItem[]) {
  const value = decodeURIComponent(hash.replace(/^#/, ""));
  if (!value) return null;
  const legacy = value.match(/^activity-(\d+)$/);
  if (legacy) return activities[Number(legacy[1])]?.slug ?? null;
  return activities.some((activity) => activity.slug === value) ? value : null;
}

export default function ProgressiveActivitiesList({
  activities,
}: {
  activities: ActivityListItem[];
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const years = useMemo(
    () =>
      Array.from(new Set(activities.map((a) => activityYear(a.date)))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [activities],
  );

  // Filters are kept in the query string (?q=&year=&focus=&sort=).
  const [filters, patchFilters, resetFilters] = useUrlFilters<Filters>(
    DEFAULT_FILTERS,
    FILTER_KEYS,
    (raw) => ({
      ...(raw.query ? { query: raw.query } : {}),
      ...(raw.year && years.includes(raw.year) ? { year: raw.year } : {}),
      ...(raw.focus === "academic" || raw.focus === "startup"
        ? { focus: raw.focus }
        : {}),
      ...(raw.sort === "oldest" ? { sort: raw.sort } : {}),
    }),
  );

  const focusCounts = useMemo(
    () => ({
      all: activities.length,
      academic: activities.filter((a) => a.category === "academic").length,
      startup: activities.filter((a) => a.category === "startup").length,
    }),
    [activities],
  );

  const searchIndex = useMemo(
    () =>
      new Map(
        activities.map((activity) => [
          activity.slug,
          createSearchDocument([
            { value: activity.name, weight: 6 },
            { value: activity.description, weight: 2 },
            { value: activity.location, weight: 3 },
            { value: activity.date },
            { value: activity.category, weight: 2 },
          ]),
        ]),
      ),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    const normalizedQuery = normalizeSearchText(filters.query);

    return activities
      .map((activity) => ({
        activity,
        score: scoreSearchDocument(
          searchIndex.get(activity.slug) ?? [],
          normalizedQuery,
        ),
      }))
      .filter(({ activity, score }) => {
        if (normalizedQuery && score === 0) return false;
        if (filters.year !== "all" && activityYear(activity.date) !== filters.year) {
          return false;
        }
        return filters.focus === "all" || activity.category === filters.focus;
      })
      .sort((a, b) => {
        if (normalizedQuery && b.score !== a.score) return b.score - a.score;
        const byDate = a.activity.date.localeCompare(b.activity.date);
        return filters.sort === "newest" ? -byDate : byDate;
      })
      .map(({ activity }) => activity);
  }, [activities, filters, searchIndex]);

  const hasMore = visibleCount < filteredActivities.length;
  const visibleActivities = filteredActivities.slice(0, visibleCount);
  const isFiltered =
    filters.query.trim() !== "" ||
    filters.year !== "all" ||
    filters.focus !== "all" ||
    filters.sort !== "newest";

  // Every filter change goes through here, so the list resets to its first
  // few cards in the same update. Resetting from an effect instead ran after
  // the deep-link reveal on load and cut the list back before the target
  // card was ever rendered.
  const updateFilters = useCallback(
    (patch: Partial<Filters>) => {
      patchFilters(patch);
      setVisibleCount(INITIAL_COUNT);
    },
    [patchFilters],
  );

  // #slug in the address bar (from the map, Kasi, or a shared link) asks for
  // that card.
  useEffect(() => {
    const reveal = () => {
      const slug = slugFromHash(window.location.hash, activities);
      if (!slug) return;
      if (window.location.hash !== `#${slug}`) {
        const url = new URL(window.location.href);
        url.hash = slug;
        window.history.replaceState(null, "", url);
      }
      setPendingTarget(slug);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [activities]);

  // Walks a requested card into view: clear filters that hide it, render
  // enough of the list to include it, then scroll once it is in the DOM.
  useEffect(() => {
    if (!pendingTarget) return;

    const index = filteredActivities.findIndex(
      (activity) => activity.slug === pendingTarget,
    );
    if (index < 0) {
      if (isFiltered) {
        resetFilters();
      } else {
        setPendingTarget(null);
      }
      return;
    }
    if (index >= visibleCount) {
      setVisibleCount(index + 1);
      return;
    }

    const element = document.getElementById(pendingTarget);
    if (!element) return;

    setPendingTarget(null);
    setHighlighted(pendingTarget);
    // Glide for short hops; jump for long ones, where a smooth scroll would
    // drag past dozens of cards (and their photos) on the way.
    const far =
      Math.abs(element.getBoundingClientRect().top) > window.innerHeight * 2;
    element.scrollIntoView({
      behavior: far ? "instant" : "smooth",
      block: "start",
    });
  }, [pendingTarget, filteredActivities, visibleCount, isFiltered, resetFilters]);

  // After a jump: photos and fonts above the card can still shift it, so
  // re-align a couple of times unless the visitor has started scrolling, and
  // let the highlight fade. Kept apart from the effect above, whose own
  // re-run would otherwise cancel these timers straight away.
  useEffect(() => {
    if (!highlighted) return;
    const element = document.getElementById(highlighted);
    if (!element) return;

    let userMoved = false;
    const stop = () => (userMoved = true);
    const events = ["wheel", "touchmove", "keydown"] as const;
    events.forEach((name) =>
      window.addEventListener(name, stop, { passive: true }),
    );
    const realign = () => {
      if (userMoved) return;
      const top = element.getBoundingClientRect().top;
      const offset = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      if (Math.abs(top - offset) > 24) {
        element.scrollIntoView({ behavior: "instant", block: "start" });
      }
    };
    const timers = [700, 1500].map((delay) => window.setTimeout(realign, delay));
    const unhighlight = window.setTimeout(() => setHighlighted(null), 2400);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(unhighlight);
      events.forEach((name) => window.removeEventListener(name, stop));
    };
  }, [highlighted]);

  // One loader: an observer on the sentinel, re-created after each batch so it
  // reports again if the sentinel is still on screen.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!hasMore || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          setVisibleCount((count) =>
            Math.min(count + BATCH_SIZE, filteredActivities.length),
          );
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleCount, filteredActivities.length]);

  const timelineEntries = useMemo(
    () =>
      filteredActivities.map((activity) => ({
        id: activity.slug,
        date: activity.date,
      })),
    [filteredActivities],
  );

  return (
    <div className="relative grid min-w-0 gap-5 lg:grid-cols-[232px_minmax(0,1fr)_76px] lg:items-start xl:grid-cols-[220px_minmax(0,1fr)_84px] xl:gap-8">
      <aside className="filter-rail rounded-lg p-4 lg:sticky lg:top-24">
        <div className="border-border/50 mb-4 flex items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden />
              <h2 className="text-sm font-semibold">Explore</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-xs" aria-live="polite">
              {filteredActivities.length}{" "}
              {filteredActivities.length === 1 ? "activity" : "activities"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => updateFilters(DEFAULT_FILTERS)}
            disabled={!isFiltered}
            className="text-muted-foreground hover:text-foreground size-9 rounded-lg"
            title="Reset filters"
          >
            <RotateCcw className="size-3.5" />
            <span className="sr-only">Reset filters</span>
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="activity-search" className="filter-label">
              Search
            </Label>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <Search className="text-muted-foreground size-3.5" aria-hidden />
              </span>
              <Input
                id="activity-search"
                type="search"
                placeholder="Topic or place"
                value={filters.query}
                onChange={(event) => updateFilters({ query: event.target.value })}
                className="border-border/60 bg-background/70 h-10 rounded-lg pl-10 text-sm shadow-none"
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="filter-label mb-2">Focus</legend>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              {(Object.keys(focusOptions) as Focus[]).map((focus) => {
                const option = focusOptions[focus];
                const Icon = option.Icon;
                const selected = filters.focus === focus;
                return (
                  <button
                    key={focus}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updateFilters({ focus })}
                    className={cn(
                      "group flex min-w-0 items-center gap-2.5 rounded-lg border p-2 text-left transition-colors",
                      selected
                        ? "border-foreground/25 bg-foreground/[0.055] shadow-sm"
                        : "hover:border-border/70 hover:bg-muted/55 border-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center",
                        option.ink,
                      )}
                    >
                      <Icon className="size-[1.15rem]" strokeWidth={1.5} />
                    </span>
                    <span className="hidden min-w-0 lg:block">
                      <span className="block truncate text-xs font-semibold">
                        {option.label}
                      </span>
                      <span className="text-muted-foreground block text-[11px]">
                        {focusCounts[focus]} items
                      </span>
                    </span>
                    <span className="truncate text-[11px] font-semibold lg:hidden">
                      {option.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="activity-year-filter" className="filter-label">
                Year
              </Label>
              <Select
                value={filters.year}
                onValueChange={(year) => updateFilters({ year })}
              >
                <SelectTrigger
                  id="activity-year-filter"
                  className="border-border/60 bg-background/70 h-10 w-full rounded-lg shadow-none"
                >
                  <CalendarDays className="text-muted-foreground mr-2 size-3.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="activity-sort-filter" className="filter-label">
                Order
              </Label>
              <Select
                value={filters.sort}
                onValueChange={(value) => updateFilters({ sort: value as Sort })}
              >
                <SelectTrigger
                  id="activity-sort-filter"
                  className="border-border/60 bg-background/70 h-10 w-full rounded-lg shadow-none"
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

      <div className="flex min-w-0 flex-col gap-5">
        <section className="relative z-10 flex min-w-0 flex-col gap-6">
          {filteredActivities.length === 0 ? (
            <div className="bg-muted/55 text-muted-foreground flex flex-col items-center gap-3 rounded-lg px-6 py-16 text-center text-sm">
              No activities match these filters.
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateFilters(DEFAULT_FILTERS)}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            visibleActivities.map((activity, index) => (
              <div
                key={activity.slug}
                id={activity.slug}
                className={cn(
                  "scroll-mt-24 rounded-lg transition-shadow duration-700",
                  highlighted === activity.slug &&
                    "ring-ink/60 ring-offset-background ring-2 ring-offset-4",
                )}
              >
                <ActivityCard
                  activity={activity}
                  photos={activity.photos}
                  priorityImage={index === 0}
                  searchQuery={filters.query.trim()}
                />
              </div>
            ))
          )}

          {filteredActivities.length > 0 && hasMore ? (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(count + BATCH_SIZE, filteredActivities.length),
                  )
                }
                className="rounded-lg"
              >
                Load more
              </Button>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="from-primary/20 h-12 w-px bg-gradient-to-b to-transparent" />
              <p className="text-muted-foreground text-xs font-medium">
                {filters.sort === "newest"
                  ? "You've reached the beginning."
                  : "You've reached the latest."}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {filteredActivities.length > 0 && (
        <TimelineBar
          entries={timelineEntries}
          renderedCount={visibleActivities.length}
          onSelectEntry={setPendingTarget}
        />
      )}
    </div>
  );
}
