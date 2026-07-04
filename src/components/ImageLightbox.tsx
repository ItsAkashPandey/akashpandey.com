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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
    >
      <div className="bg-background/45 pointer-events-none absolute inset-0 backdrop-blur-xl dark:bg-zinc-950/62" />

      <motion.div
        className="border-border/60 bg-background/96 relative z-10 flex h-[min(76vh,720px)] w-[min(92vw,920px)] flex-col overflow-hidden rounded-[30px] border shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:bg-zinc-950/94 dark:shadow-[0_34px_100px_rgba(0,0,0,0.55)]"
        initial={{ scale: 0.985, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.985, y: 8 }}
        transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="from-background/90 pointer-events-none absolute inset-x-0 top-0 z-30 h-20 bg-gradient-to-b to-transparent dark:from-black/55" />
        <div className="absolute top-3 right-3 left-3 z-40 flex items-center justify-between gap-3">
          <div className="border-border/60 bg-background/75 text-muted-foreground rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-xl">
            {currentIndex + 1} / {images.length}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border-border/60 bg-background/75 text-foreground hover:bg-muted grid size-9 place-items-center rounded-full border shadow-sm backdrop-blur-xl transition"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        <div
          className="bg-muted/20 relative min-h-0 flex-1 overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)/.42) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/.42) 1px, transparent 1px), radial-gradient(circle at 50% 45%, hsl(var(--background)) 0, transparent 64%)",
            backgroundSize: "24px 24px, 24px 24px, 100% 100%",
          }}
        >
          <span className="border-foreground/8 pointer-events-none absolute -top-16 -right-14 size-44 rotate-12 rounded-[42px] border" />
          <span className="bg-foreground/[0.025] pointer-events-none absolute -bottom-16 -left-12 size-40 rotate-45 rounded-[36px]" />
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
                    className="absolute inset-0 grid place-items-center px-4 py-12 sm:px-10 sm:py-14"
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
          <div className="border-border/60 bg-background/78 border-t px-3 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
              {images.map((src, index) => {
                const active = index === currentIndex;
                return (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => goTo(index)}
                    className={cn(
                      "bg-muted relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border transition",
                      active
                        ? "border-foreground/60 shadow-[0_0_0_2px_hsl(var(--foreground)/.10)]"
                        : "border-border/60 opacity-65 hover:opacity-100",
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="64px"
                      quality={75}
                      className="object-contain p-1"
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
                      <span className="bg-foreground absolute inset-x-2 bottom-1 h-0.5 rounded-full" />
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
  const [loaded, setLoaded] = useState(() => isBrowserImageCached(src));

  return (
    <div className="relative grid h-full w-full place-items-center">
      {!loaded && (
        <div className="border-border/55 bg-muted/70 absolute h-[68%] w-[76%] max-w-2xl animate-pulse overflow-hidden rounded-[20px] border">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_0_52%,hsl(var(--border))_53_68%,hsl(var(--muted-foreground)/.12)_69%)]" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "max-h-full max-w-full rounded-[18px] object-contain shadow-[0_22px_60px_rgba(15,23,42,0.18)] transition-[opacity,filter,transform] duration-300 select-none dark:shadow-[0_24px_70px_rgba(0,0,0,0.48)]",
          active ? "will-change-transform" : "opacity-90",
          loaded
            ? "blur-0 scale-100 opacity-100"
            : "scale-[.985] opacity-0 blur-md",
          className,
        )}
        data-loaded={loaded ? "true" : "false"}
        loading={active ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        fetchPriority={active ? "high" : "low"}
        onLoad={() => {
          setLoaded(true);
          onReady();
        }}
        onError={() => {
          setLoaded(true);
          onReady();
        }}
        style={{ imageOrientation: "from-image" }}
      />
    </div>
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
        "border-border/60 bg-background/76 text-foreground hover:bg-muted absolute top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full border shadow-lg backdrop-blur-xl transition",
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
