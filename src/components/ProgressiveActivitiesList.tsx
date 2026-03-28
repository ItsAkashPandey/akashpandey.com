"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity } from "@/lib/schemas";
import LazyActivity from "./LazyActivity";
import TimelineBar from "./TimelineBar";

type ActivityWithMeta = Activity & { elementId: string; resolvedImages: string[] };

interface Props {
  allActivities: ActivityWithMeta[];
  initialVisibleCount: number;
}

const BATCH_SIZE = 3;

export default function ProgressiveActivitiesList({
  allActivities,
  initialVisibleCount = 5,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < allActivities.length;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount(prev => Math.min(prev + BATCH_SIZE, allActivities.length));
    // Let TimelineBar recalculate sizes after DOM settles
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("timeline-measure"));
    });
  }, [hasMore, allActivities.length]);

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
      allActivities.map((activity) => ({
        id: activity.elementId,
        date: activity.date,
      })),
    [allActivities],
  );

  return (
    <div className="relative">
      <section className="flex flex-col gap-8 relative z-10">
        {allActivities.map((activity, index) => (
          <LazyActivity
            key={activity.elementId}
            activity={activity}
            index={index}
            initiallyVisible={index < visibleCount}
          />
        ))}

        {hasMore ? (
          <div ref={sentinelRef} className="h-16" aria-hidden="true" />
        ) : (
          /* End-of-list indicator */
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-12 w-px bg-gradient-to-b from-primary/20 to-transparent" />
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60">
              You&apos;ve seen it all ✨
            </p>
          </div>
        )}
      </section>

      <TimelineBar entries={timelineEntries} />
    </div>
  );
}