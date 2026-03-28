"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface LazySectionProps {
  children: React.ReactNode;
  /** Approximate height hint for the skeleton placeholder */
  heightHint?: number;
  /** Root margin for IntersectionObserver (default: 400px) */
  rootMargin?: string;
  /** Optional className for the wrapper */
  className?: string;
}

export default function LazySection({
  children,
  heightHint = 300,
  rootMargin = "400px",
  className,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  useEffect(() => {
    if (isVisible) {
      // Small delay for fade-in
      const raf = requestAnimationFrame(() => setHasRendered(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div ref={ref} className={className} style={{ minHeight: heightHint }}>
        <Skeleton
          className="w-full rounded-2xl"
          style={{ height: heightHint }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        opacity: hasRendered ? 1 : 0,
        transition: "opacity 0.5s ease-out",
      }}
    >
      {children}
    </div>
  );
}
