"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

interface StackedImageDeckProps {
  images: string[];
  alt?: string;
  className?: string;
  cardClassName?: string;
  imageClassName?: string;
  imageWidth: number;
  imageHeight: number;
  sizes: string;
  priority?: boolean;
  quality?: number;
  idleQuality?: number;
  showCounter?: boolean;
  labels?: string[];
  gridBackground?: boolean;
  stackSize?: number;
  onImageClick?: (index: number) => void;
}

type Direction = 1 | -1;

function wrapIndex(index: number, total: number) {
  return ((index % total) + total) % total;
}

const cardVariants = {
  enter: (direction: Direction) => ({
    x: direction === 1 ? "16%" : "-16%",
    rotate: direction === 1 ? 3.5 : -3.5,
    opacity: 0.55,
    scale: 0.985,
  }),
  center: {
    x: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: Direction) => ({
    x: direction === 1 ? "-118%" : "118%",
    rotate: direction === 1 ? -7 : 7,
    opacity: 0,
    scale: 0.965,
    transition: {
      duration: 0.28,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  }),
};

export default function StackedImageDeck({
  images,
  alt = "Image",
  className,
  cardClassName,
  imageClassName,
  sizes,
  priority = false,
  quality = 84,
  showCounter = false,
  labels,
  stackSize = 3,
  onImageClick,
}: StackedImageDeckProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadedSources, setLoadedSources] = useState<Set<string>>(
    () => new Set(),
  );
  const [direction, setDirection] = useState<Direction>(1);
  const [moving, setMoving] = useState(false);
  const draggedRef = useRef(false);

  const visibleDepth = Math.min(
    Math.max(0, stackSize - 1),
    Math.max(0, images.length - 1),
    3,
  );
  const backCards = useMemo(
    () =>
      Array.from({ length: visibleDepth }, (_, offset) => {
        const depth = visibleDepth - offset;
        return {
          depth,
          index: wrapIndex(selectedIndex + direction * depth, images.length),
        };
      }),
    [direction, images.length, selectedIndex, visibleDepth],
  );

  const markLoaded = useCallback((src: string) => {
    setLoadedSources((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const move = useCallback(
    (nextDirection: Direction) => {
      if (images.length <= 1 || moving) return;
      setDirection(nextDirection);
      setMoving(true);
      setSelectedIndex((current) =>
        wrapIndex(current + nextDirection, images.length),
      );
    },
    [images.length, moving],
  );

  if (!images.length) {
    return (
      <div className={cn("grid place-items-center", className)}>
        <div className="text-muted-foreground px-4 py-6 text-center text-xs">
          No images
        </div>
      </div>
    );
  }

  const selectedSource = images[selectedIndex];

  return (
    <div
      data-stacked-deck
      className={cn("group/gallery relative isolate", className)}
      role="region"
      aria-label={`${alt} gallery`}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        } else if (
          (event.key === "Enter" || event.key === " ") &&
          onImageClick
        ) {
          event.preventDefault();
          onImageClick(selectedIndex);
        }
      }}
    >
      {backCards.map(({ depth, index }) => {
        const source = images[index];
        const side = depth % 2 === 0 ? -1 : 1;
        const horizontal = side * (7 + depth * 4);
        const rotation = side * (2.4 + depth * 0.7);

        return (
          <div
            key={`back-${depth}-${index}-${source}`}
            aria-hidden
            className="absolute inset-0 overflow-hidden rounded-[inherit] shadow-[0_14px_34px_rgba(15,23,42,.16)] transition-[transform,opacity] duration-500 ease-out dark:shadow-[0_18px_40px_rgba(0,0,0,.48)]"
            style={{
              transform: `translate3d(${horizontal}px, ${depth * 9}px, 0) rotate(${rotation}deg) scale(${1 - depth * 0.025})`,
              transformOrigin: side > 0 ? "88% 12%" : "12% 12%",
              zIndex: visibleDepth - depth + 1,
              opacity: 1 - depth * 0.12,
            }}
          >
            <PhotoSurface>
              {!loadedSources.has(source) && (
                <PhotoSkeleton variant={index % 3} />
              )}
              <Image
                src={source}
                alt=""
                fill
                draggable={false}
                sizes={sizes}
                quality={quality}
                loading={depth <= 2 ? "eager" : "lazy"}
                className={cn(
                  "pointer-events-none object-cover transition-[opacity,filter] duration-300 select-none",
                  loadedSources.has(source)
                    ? "blur-0 opacity-100"
                    : "opacity-0 blur-md",
                )}
                onLoad={() => markLoaded(source)}
                onError={() => markLoaded(source)}
              />
            </PhotoSurface>
          </div>
        );
      })}

      <AnimatePresence
        initial={false}
        custom={direction}
        onExitComplete={() => setMoving(false)}
      >
        <motion.div
          key={`front-${selectedIndex}-${selectedSource}`}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 390, damping: 34, mass: 0.74 },
            rotate: {
              type: "spring",
              stiffness: 390,
              damping: 34,
              mass: 0.74,
            },
            scale: { duration: 0.2, ease: "easeOut" },
            opacity: { duration: 0.18, ease: "easeOut" },
          }}
          data-deck-card="front"
          tabIndex={0}
          className={cn(
            "absolute inset-0 z-10 cursor-grab touch-pan-y overflow-hidden rounded-[inherit] shadow-[0_18px_38px_rgba(15,23,42,.16)] outline-none select-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing dark:shadow-[0_24px_48px_rgba(0,0,0,.48)]",
            cardClassName,
          )}
          drag={images.length > 1 && !moving ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.34}
          dragMomentum={false}
          dragTransition={{ bounceStiffness: 460, bounceDamping: 34 }}
          onDragStart={() => {
            draggedRef.current = true;
          }}
          onDrag={(_, info) => {
            if (Math.abs(info.offset.x) < 8) return;
            const previewDirection = info.offset.x < 0 ? 1 : -1;
            if (previewDirection !== direction) {
              setDirection(previewDirection);
            }
          }}
          onDragEnd={(_, info) => {
            const shouldMove =
              Math.abs(info.offset.x) > 58 || Math.abs(info.velocity.x) > 430;
            if (shouldMove) {
              move(info.offset.x < 0 ? 1 : -1);
            }
            window.setTimeout(() => {
              draggedRef.current = false;
            }, 0);
          }}
          onTap={() => {
            if (!draggedRef.current) onImageClick?.(selectedIndex);
          }}
        >
          <PhotoSurface>
            {!loadedSources.has(selectedSource) && (
              <PhotoSkeleton variant={selectedIndex % 3} />
            )}
            <Image
              src={selectedSource}
              alt={alt}
              fill
              draggable={false}
              sizes={sizes}
              quality={quality}
              priority={priority && selectedIndex === 0}
              loading={priority || selectedIndex === 0 ? "eager" : "lazy"}
              fetchPriority={priority && selectedIndex === 0 ? "high" : "auto"}
              className={cn(
                "pointer-events-none object-cover transition-[opacity,filter] duration-300 select-none",
                loadedSources.has(selectedSource)
                  ? "blur-0 opacity-100"
                  : "opacity-0 blur-md",
                imageClassName,
              )}
              onLoad={() => markLoaded(selectedSource)}
              onError={() => markLoaded(selectedSource)}
              style={{ imageOrientation: "from-image" }}
            />
          </PhotoSurface>

          {(labels?.[selectedIndex] || showCounter || images.length > 1) && (
            <>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/42 to-transparent" />
              <div className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 flex items-end justify-between gap-2">
                {labels?.[selectedIndex] ? (
                  <span className="min-w-0 truncate rounded-full bg-black/42 px-2.5 py-1 text-[10px] font-semibold text-white/92 backdrop-blur-md">
                    {labels[selectedIndex]}
                  </span>
                ) : (
                  <span />
                )}
                {(showCounter || images.length > 1) && (
                  <span className="shrink-0 rounded-full bg-black/42 px-2 py-1 text-[10px] font-semibold text-white tabular-nums backdrop-blur-md">
                    {selectedIndex + 1}/{images.length}
                  </span>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              move(-1);
            }}
            className="absolute top-1/2 left-2 z-20 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-zinc-950/44 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover/gallery:opacity-100 hover:scale-105 hover:bg-zinc-950/70 active:scale-95 sm:grid"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              move(1);
            }}
            className="absolute top-1/2 right-2 z-20 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-zinc-950/44 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover/gallery:opacity-100 hover:scale-105 hover:bg-zinc-950/70 active:scale-95 sm:grid"
            aria-label="Next image"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}

function PhotoSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden">{children}</div>
  );
}

function PhotoSkeleton({ variant }: { variant: number }) {
  return (
    <div
      aria-hidden
      className="bg-muted absolute inset-0 z-[1] overflow-hidden"
    >
      <div
        className={cn(
          "absolute inset-0 animate-pulse",
          variant === 0 &&
            "bg-[linear-gradient(165deg,hsl(var(--muted))_0_52%,hsl(var(--border))_53_67%,hsl(var(--muted-foreground)/.14)_68%)]",
          variant === 1 &&
            "bg-[linear-gradient(185deg,hsl(var(--muted))_0_44%,hsl(var(--border))_45_70%,hsl(var(--muted-foreground)/.12)_71%)]",
          variant === 2 &&
            "bg-[radial-gradient(circle_at_30%_38%,hsl(var(--border))_0_13%,transparent_14%),linear-gradient(155deg,hsl(var(--muted))_0_58%,hsl(var(--border))_59%)]",
        )}
      />
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/22 to-transparent" />
    </div>
  );
}
