"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityCard } from "./ActivityCard";
import { Activity } from "@/lib/schemas";

interface Props {
    activity: Activity & { elementId: string; resolvedImages: string[] };
    index: number;
}

export default function LazyActivity({ activity, index }: Props) {
    // Always render the first 3 immediately to ensure above-the-fold content is ready
    const [isIntersecting, setIsIntersecting] = useState(index < 3);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isIntersecting) return; // Already loaded

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    observer.disconnect();

                    // Dispatch an event so TimelineBar can recalculate card heights
                    // We wait a tiny bit to allow the DOM to fully paint the images/content
                    setTimeout(() => {
                        window.dispatchEvent(new Event("timeline-measure"));
                    }, 100);
                }
            },
            // Load it when it's 800px away from the viewport (approx 1-2 scrolls away)
            { rootMargin: "800px" }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [isIntersecting]);

    return (
        <div id={activity.elementId} ref={containerRef} className="min-h-[250px]">
            {isIntersecting ? (
                <ActivityCard activity={activity} images={activity.resolvedImages} />
            ) : (
                <div className="w-full h-[300px] animate-pulse rounded-2xl bg-white/5 dark:bg-white/[0.02] border border-white/10" />
            )}
        </div>
    );
}
