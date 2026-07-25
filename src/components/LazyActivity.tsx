"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityCard } from "./ActivityCard";
import { Activity } from "@/lib/schemas";
import { Skeleton } from "./ui/skeleton";

interface Props {
  activity: Activity & { elementId: string; resolvedImages: string[] };
  index: number;
  initiallyVisible?: boolean;
  searchQuery?: string;
}

export default function LazyActivity({
  activity,
  index,
  initiallyVisible,
  searchQuery,
}: Props) {
  const [isIntersecting, setIsIntersecting] = useState(
    initiallyVisible ?? index < 5,
  );
  const [hasRendered, setHasRendered] = useState(initiallyVisible ?? index < 5);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initiallyVisible) return;
    setIsIntersecting(true);
    setHasRendered(true);
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("timeline-measure"));
    });
  }, [initiallyVisible]);

  useEffect(() => {
    if (isIntersecting) {
      // Small delay for fade-in effect
      const t = requestAnimationFrame(() => setHasRendered(true));
      window.dispatchEvent(new Event("timeline-measure"));
      return () => cancelAnimationFrame(t);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();

          // Dispatch an event so TimelineBar can recalculate card heights
          setTimeout(() => {
            window.dispatchEvent(new Event("timeline-measure"));
          }, 100);
        }
      },
      { rootMargin: "300px" },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isIntersecting]);

  return (
    <div
      id={activity.elementId}
      ref={containerRef}
      className="min-h-[250px] scroll-mt-24"
    >
      {isIntersecting ? (
        <div
          className="transition-opacity duration-500 ease-out"
          style={{ opacity: hasRendered ? 1 : 0 }}
        >
          <ActivityCard
            activity={activity}
            images={activity.resolvedImages}
            priorityImage={index === 0}
            searchQuery={searchQuery}
          />
        </div>
      ) : (
        <ActivityCardSkeleton />
      )}
    </div>
  );
}

function ActivityCardSkeleton() {
  return (
    <div
      className="record-surface relative overflow-hidden rounded-lg p-4 sm:p-7"
      aria-hidden
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[300px_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>

          <div className="relative grid h-[200px] w-full max-w-[280px] place-items-center sm:h-[220px] sm:max-w-[300px]">
            <Skeleton className="bg-muted/55 absolute h-[176px] w-[86%] rotate-[-6deg] rounded-lg sm:h-[196px]" />
            <Skeleton className="bg-muted/65 absolute h-[176px] w-[90%] rotate-[5deg] rounded-lg sm:h-[196px]" />
            <div className="absolute h-[176px] w-full max-w-[280px] overflow-hidden rounded-lg sm:h-[196px] sm:max-w-[300px]">
              <Skeleton className="bg-muted/75 h-full w-full rounded-lg" />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <Skeleton className="h-6 w-4/5 rounded-md" />
          <Skeleton className="h-0.5 w-10 rounded-md" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-[92%] rounded-md" />
            <Skeleton className="h-3.5 w-[86%] rounded-md" />
            <Skeleton className="h-3.5 w-[64%] rounded-md" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
