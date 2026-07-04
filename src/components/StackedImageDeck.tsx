"use client";

import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
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

function wrapIndex(index: number, total: number) {
  return ((index % total) + total) % total;
}

export default function StackedImageDeck({
  images,
  alt = "Image",
  className,
  cardClassName,
  imageClassName,
  sizes,
  priority = false,
  quality = 84,
  idleQuality: _idleQuality,
  showCounter = false,
  labels,
  gridBackground = true,
  stackSize = 3,
  onImageClick,
}: StackedImageDeckProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadedSources, setLoadedSources] = useState<Set<string>>(
    () => new Set(),
  );
  const [moving, setMoving] = useState(false);
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-260, 0, 260], [-11, 0, 11]);
  const opacity = useTransform(
    dragX,
    [-280, -160, 0, 160, 280],
    [0.25, 0.88, 1, 0.88, 0.25],
  );
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
          index: wrapIndex(selectedIndex + depth, images.length),
        };
      }),
    [images.length, selectedIndex, visibleDepth],
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
    async (direction: 1 | -1) => {
      if (images.length <= 1 || moving) return;
      setMoving(true);
      await animate(dragX, direction === 1 ? -340 : 340, {
        duration: 0.2,
        ease: [0.32, 0.72, 0, 1],
      });
      setSelectedIndex((current) =>
        wrapIndex(current + direction, images.length),
      );
      dragX.set(0);
      setMoving(false);
    },
    [dragX, images.length, moving],
  );

  if (!images.length) {
    return (
      <div className={cn("grid place-items-center", className)}>
        <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-xs">
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
          void move(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          void move(1);
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
        const rotation =
          depth % 2 === 0 ? 2.8 + depth * 0.35 : -2.4 - depth * 0.3;
        const inset = depth * 3.5;

        return (
          <div
            key={`back-${depth}-${index}-${source}`}
            aria-hidden
            className="border-border/55 bg-muted absolute overflow-hidden rounded-[inherit] border shadow-[0_16px_36px_rgba(15,23,42,.12)] transition-[transform,opacity] duration-500 ease-out dark:shadow-[0_18px_40px_rgba(0,0,0,.42)]"
            style={{
              inset: `${inset}px`,
              transform: `translateY(${depth * 5}px) rotate(${rotation}deg) scale(${1 - depth * 0.018})`,
              zIndex: -depth,
              opacity: 1 - depth * 0.12,
            }}
          >
            <PhotoStage gridBackground={gridBackground}>
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
                  "pointer-events-none object-contain p-2 transition-[opacity,filter] duration-500 select-none sm:p-3",
                  loadedSources.has(source)
                    ? "blur-0 opacity-100"
                    : "opacity-0 blur-md",
                )}
                onLoad={() => markLoaded(source)}
                onError={() => markLoaded(source)}
              />
            </PhotoStage>
          </div>
        );
      })}

      <motion.div
        key={`front-${selectedIndex}-${selectedSource}`}
        data-deck-card="front"
        tabIndex={0}
        className={cn(
          "border-border/60 bg-background absolute inset-0 z-10 cursor-grab touch-pan-y overflow-hidden rounded-[inherit] border shadow-[0_18px_46px_rgba(15,23,42,.17)] ring-offset-2 outline-none select-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing dark:shadow-[0_22px_52px_rgba(0,0,0,.52)]",
          cardClassName,
        )}
        style={{ x: dragX, rotate, opacity }}
        drag={images.length > 1 && !moving ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.62}
        dragMomentum={false}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={(_, info) => {
          const shouldMove =
            Math.abs(info.offset.x) > 72 || Math.abs(info.velocity.x) > 520;
          if (shouldMove) {
            void move(info.offset.x < 0 ? 1 : -1);
          } else {
            void animate(dragX, 0, {
              type: "spring",
              stiffness: 520,
              damping: 38,
              mass: 0.7,
            });
          }
          window.setTimeout(() => {
            draggedRef.current = false;
          }, 0);
        }}
        onTap={() => {
          if (!draggedRef.current) onImageClick?.(selectedIndex);
        }}
      >
        <PhotoStage gridBackground={gridBackground}>
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
              "pointer-events-none object-contain p-2 transition-[opacity,filter,transform] duration-400 select-none sm:p-3",
              loadedSources.has(selectedSource)
                ? "blur-0 scale-100 opacity-100"
                : "scale-[1.015] opacity-0 blur-md",
              imageClassName,
            )}
            onLoad={() => markLoaded(selectedSource)}
            onError={() => markLoaded(selectedSource)}
            style={{ imageOrientation: "from-image" }}
          />
        </PhotoStage>

        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/36 ring-inset dark:ring-white/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/46 via-black/10 to-transparent" />

        <div className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 flex items-end justify-between gap-2">
          <span className="min-w-0 truncate rounded-full bg-black/42 px-2.5 py-1 text-[10px] font-semibold text-white/92 backdrop-blur-md">
            {labels?.[selectedIndex] ??
              (images.length > 1 ? "drag to browse" : "open image")}
          </span>
          {(showCounter || images.length > 1) && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-black/42 px-2 py-1 text-[10px] font-semibold text-white tabular-nums backdrop-blur-md">
              <Maximize2 className="size-2.5" />
              {selectedIndex + 1}/{images.length}
            </span>
          )}
        </div>
      </motion.div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void move(-1);
            }}
            className="absolute top-1/2 left-2 z-20 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-white/18 bg-zinc-950/44 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover/gallery:opacity-100 hover:bg-zinc-950/70 sm:grid"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void move(1);
            }}
            className="absolute top-1/2 right-2 z-20 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-white/18 bg-zinc-950/44 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover/gallery:opacity-100 hover:bg-zinc-950/70 sm:grid"
            aria-label="Next image"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}

function PhotoStage({
  children,
  gridBackground,
}: {
  children: React.ReactNode;
  gridBackground: boolean;
}) {
  return (
    <div
      className="bg-muted/35 relative h-full w-full overflow-hidden"
      style={
        gridBackground
          ? {
              backgroundImage:
                "linear-gradient(hsl(var(--border)/.46) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/.46) 1px, transparent 1px), radial-gradient(circle at 18% 12%, hsl(var(--background)) 0, transparent 44%)",
              backgroundSize: "18px 18px, 18px 18px, 100% 100%",
            }
          : undefined
      }
    >
      <span className="border-foreground/8 pointer-events-none absolute -top-8 -right-8 size-24 rotate-12 rounded-[22px] border" />
      <span className="bg-foreground/[0.035] pointer-events-none absolute -bottom-8 -left-8 size-20 rotate-45 rounded-2xl" />
      {children}
    </div>
  );
}

function PhotoSkeleton({ variant }: { variant: number }) {
  return (
    <div
      aria-hidden
      className="bg-muted absolute inset-2 z-[1] overflow-hidden rounded-[14px] sm:inset-3"
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
