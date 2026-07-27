"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * One NASA Scientific Visualization Studio sequence per page, chosen so the
 * footage says something about what the page is for. All public domain.
 */
const CLIPS: Record<string, { src: string; description: string }> = {
  home: {
    src: "/motion/home.mp4",
    description: "Twenty years of global biosphere data on a spinning Earth",
  },
  activities: {
    src: "/motion/activities.mp4",
    description: "Landsat Next planned orbits and swath coverage",
  },
  publications: {
    src: "/motion/publications.mp4",
    description: "Seasonal cycles of the vegetation index",
  },
  skills: {
    src: "/motion/skills.mp4",
    description: "Landsat and Sentinel building global coverage together",
  },
  contact: {
    src: "/motion/contact.mp4",
    description: "Landsat 8 and 9 orbital coverage",
  },
};

export default function PageMotion() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const segment = pathname.split("/").filter(Boolean)[0] ?? "home";
  const clip = CLIPS[segment];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const wide = window.matchMedia("(min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!wide.matches || reduced.matches) return;

    let target = 0;
    let current = 0;
    let frame = 0;

    const readScroll = () => {
      const range = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      target = Math.min(1, Math.max(0, window.scrollY / range));
    };

    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      if (document.visibilityState === "hidden") return;

      // Trailing the scroll keeps the seek smooth instead of snapping frame to
      // frame with the wheel.
      current += (target - current) * 0.14;

      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      if (video.seeking) return;

      const next = current * duration;
      // Sub-frame seeks are wasted work and make the decoder stutter.
      if (Math.abs(next - video.currentTime) < 1 / 24) return;
      video.currentTime = next;
    };

    readScroll();
    current = target;
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
    };
  }, [clip?.src]);

  if (!clip || pathname.startsWith("/admin")) return null;

  return (
    <div className="page-motion" data-route={segment} aria-hidden="true">
      <video
        ref={videoRef}
        className="page-motion__video"
        src={clip.src}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
      />
    </div>
  );
}
