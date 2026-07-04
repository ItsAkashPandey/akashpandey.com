"use client";

import {
  isBrowserImageCached,
  markBrowserImageLoaded,
  preloadBrowserImage,
} from "@/lib/browser-image-cache";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
} from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  imageClassName?: string;
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function wrappedDistance(index: number, current: number, total: number) {
  const direct = Math.abs(index - current);
  return Math.min(direct, total - direct);
}

function getVisibleIndexes(currentIndex: number, total: number) {
  if (total <= 1) return [currentIndex];
  const indexes = [
    wrapIndex(currentIndex - 1, total),
    currentIndex,
    wrapIndex(currentIndex + 1, total),
  ];
  return Array.from(new Set(indexes));
}

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  imageClassName = "",
}: ImageLightboxProps) {
  const directionRef = useRef(1);
  const dragX = useMotionValue(0);
  const [, setLoadedVersion] = useState(0);
  const clickStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const markLoaded = useCallback((src: string) => {
    markBrowserImageLoaded(src);
    setLoadedVersion((version) => version + 1);
  }, []);

  const goNext = useCallback(() => {
    directionRef.current = 1;
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    directionRef.current = -1;
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const goTo = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      directionRef.current = index > currentIndex ? 1 : -1;
      onNavigate(index);
    },
    [currentIndex, onNavigate],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && images.length > 1) goNext();
      if (event.key === "ArrowLeft" && images.length > 1) goPrev();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [goNext, goPrev, images.length, onClose]);

  useEffect(() => {
    if (!images.length) return;

    const nearIndexes = [0, -1, 1, -2, 2].map((offset) =>
      wrapIndex(currentIndex + offset, images.length),
    );
    const nearSources = Array.from(
      new Set(nearIndexes.map((idx) => images[idx])),
    );
    const restSources = images.filter((src) => !nearSources.includes(src));
    let cancelled = false;

    const warm = (src: string) => {
      preloadBrowserImage(src).then(() => {
        if (!cancelled) setLoadedVersion((version) => version + 1);
      });
    };

    nearSources.forEach(warm);
    const timeoutId = window.setTimeout(() => restSources.forEach(warm), 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentIndex, images]);

  const visibleIndexes = useMemo(
    () => getVisibleIndexes(currentIndex, images.length),
    [currentIndex, images.length],
  );

  const getSlideOffset = useCallback(
    (index: number) => {
      if (index === currentIndex) return 0;
      if (images.length === 2) return directionRef.current < 0 ? -1 : 1;
      if (index === wrapIndex(currentIndex + 1, images.length)) return 1;
      return -1;
    },
    [currentIndex, images.length],
  );

  const handleBackdropPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      clickStartPosRef.current = { x: event.clientX, y: event.clientY };
    }
  };

  const handleBackdropPointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!clickStartPosRef.current) return;
    const dx = Math.abs(event.clientX - clickStartPosRef.current.x);
    const dy = Math.abs(event.clientY - clickStartPosRef.current.y);
    clickStartPosRef.current = null;
    if (dx < 10 && dy < 10) onClose();
  };

  if (!images.length) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
    >
      <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-2xl" />

      <motion.div
        className="relative z-10 flex h-[min(92vh,860px)] w-[min(96vw,1120px)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/82 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
        initial={{ scale: 0.985, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.985, y: 8 }}
        transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute top-3 right-3 left-3 z-40 flex items-center justify-between gap-3">
          <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold text-white/80 shadow-lg backdrop-blur-xl">
            {currentIndex + 1} / {images.length}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-white/10 bg-black/35 text-white/90 shadow-lg backdrop-blur-xl transition hover:bg-white/15"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.12),transparent_30%),#07070a]">
          <motion.div
            className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ x: dragX }}
            drag={images.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 && images.length > 1) {
                goPrev();
              } else if (info.offset.x < -80 && images.length > 1) {
                goNext();
              }
              animate(dragX, 0, {
                type: "spring",
                stiffness: 560,
                damping: 42,
                mass: 0.68,
              });
            }}
          >
            <AnimatePresence initial={false}>
              {visibleIndexes.map((index) => {
                const offset = getSlideOffset(index);
                const src = images[index];

                return (
                  <motion.div
                    key={`${index}-${src}`}
                    className="absolute inset-0 grid place-items-center px-3 py-10 sm:px-8 sm:py-12"
                    initial={false}
                    animate={{
                      x: `${offset * 100}%`,
                      scale: offset === 0 ? 1 : 0.985,
                    }}
                    exit={{
                      x: `${directionRef.current > 0 ? -100 : 100}%`,
                      scale: 0.985,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 560,
                      damping: 44,
                      mass: 0.72,
                    }}
                  >
                    <LightboxImage
                      src={src}
                      alt={`Image ${index + 1} of ${images.length}`}
                      active={offset === 0}
                      className={imageClassName}
                      onReady={() => markLoaded(src)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {images.length > 1 && (
            <>
              <NavButton direction="prev" onClick={goPrev} />
              <NavButton direction="next" onClick={goNext} />
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="border-t border-white/10 bg-black/32 px-3 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
              {images.map((src, index) => {
                const active = index === currentIndex;
                return (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => goTo(index)}
                    className={cn(
                      "relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border bg-zinc-900 transition",
                      active
                        ? "border-white/85 shadow-[0_0_0_2px_rgba(255,255,255,0.18)]"
                        : "border-white/10 opacity-65 hover:opacity-100",
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="64px"
                      quality={75}
                      className="object-cover"
                      loading={
                        wrappedDistance(index, currentIndex, images.length) <= 4
                          ? "eager"
                          : "lazy"
                      }
                      draggable={false}
                      onLoad={() => markLoaded(src)}
                      style={{ imageOrientation: "from-image" }}
                    />
                    {active && (
                      <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function LightboxImage({
  src,
  alt,
  active,
  className,
  onReady,
}: {
  src: string;
  alt: string;
  active: boolean;
  className?: string;
  onReady: () => void;
}) {
  const loaded = isBrowserImageCached(src);

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "max-h-full max-w-full rounded-[18px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)] select-none",
        active ? "will-change-transform" : "opacity-90",
        className,
      )}
      data-loaded={loaded ? "true" : "false"}
      loading={active ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      fetchPriority={active ? "high" : "low"}
      onLoad={onReady}
      onError={onReady}
      style={{ imageOrientation: "from-image" }}
    />
  );
}

function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "absolute top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/35 text-white/90 shadow-xl backdrop-blur-xl transition hover:bg-white/15",
        isPrev ? "left-3 sm:left-5" : "right-3 sm:right-5",
      )}
      aria-label={isPrev ? "Previous" : "Next"}
    >
      {isPrev ? (
        <ChevronLeft className="size-5" strokeWidth={2.5} />
      ) : (
        <ChevronRight className="size-5" strokeWidth={2.5} />
      )}
    </button>
  );
}
