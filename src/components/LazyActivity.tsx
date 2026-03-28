"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityCard } from "./ActivityCard";
import { Activity } from "@/lib/schemas";
import { Skeleton } from "./ui/skeleton";
import { ImageIcon } from "lucide-react";

interface Props {
    activity: Activity & { elementId: string; resolvedImages: string[] };
    index: number;
    initiallyVisible?: boolean;
}

export default function LazyActivity({ activity, index, initiallyVisible }: Props) {
    const [isIntersecting, setIsIntersecting] = useState(initiallyVisible ?? index < 5);
    const [hasRendered, setHasRendered] = useState(initiallyVisible ?? index < 5);
    const containerRef = useRef<HTMLDivElement>(null);

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
            { rootMargin: "800px" }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [isIntersecting]);

    return (
        <div id={activity.elementId} ref={containerRef} className="min-h-[250px] scroll-mt-24">
            {isIntersecting ? (
                <div
                    className="transition-opacity duration-500 ease-out"
                    style={{ opacity: hasRendered ? 1 : 0 }}
                >
                    <ActivityCard activity={activity} images={activity.resolvedImages} />
                </div>
            ) : (
                <div className="w-full h-[300px] rounded-3xl border border-white/10 dark:border-white/5 bg-muted/40 relative overflow-hidden">
                    {/* Shimmer skeleton */}
                    <Skeleton className="absolute inset-0 rounded-3xl" />
                    {/* Image placeholder icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                            <ImageIcon className="size-8" />
                            <span className="text-xs font-medium tracking-wide">Loading activity...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
