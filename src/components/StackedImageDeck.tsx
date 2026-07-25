"use client";

import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [direction, setDirection] = useState<Direction>(1);
  const [moving, setMoving] = useState(false);
  const draggedRef = useRef(false);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-220, 0, 220], [-14, 0, 14]);
  const dragOpacity = useTransform(
    dragX,
    [-320, -90, 0, 90, 320],
    [0.18, 0.9, 1, 0.9, 0.18],
  );
  const dragScale = useTransform(
    dragX,
    [-220, -80, 0, 80, 220],
    [0.97, 0.995, 1, 0.995, 0.97],
  );

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

  const move = useCallback(
    async (nextDirection: Direction) => {
      if (images.length <= 1 || moving) return;
      setDirection(nextDirection);
      setMoving(true);
      const viewportWidth =
        typeof window === "undefined" ? 900 : window.innerWidth;
      const exitDistance = Math.max(460, viewportWidth * 0.72);

      await new Promise<void>((resolve) => {
        animate(dragX, nextDirection === 1 ? -exitDistance : exitDistance, {
          type: "spring",
          stiffness: 330,
          damping: 33,
          mass: 0.72,
          velocity: nextDirection === 1 ? -520 : 520,
          onComplete: resolve,
        });
      });

      setSelectedIndex((current) =>
        wrapIndex(current + nextDirection, images.length),
      );
      window.requestAnimationFrame(() => {
        dragX.set(0);
        setMoving(false);
      });
    },
    [dragX, images.length, moving],
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
          <motion.div
            key={`back-${depth}-${index}-${source}`}
            aria-hidden
            className="absolute inset-0 overflow-hidden rounded-[inherit] drop-shadow-[0_16px_20px_rgba(15,23,42,.15)] dark:drop-shadow-[0_18px_24px_rgba(0,0,0,.42)]"
            initial={false}
            animate={{
              x: horizontal,
              y: depth * 8,
              rotate: rotation,
              scale: 1 - depth * 0.025,
              opacity: 1 - depth * 0.1,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 38,
              mass: 0.72,
            }}
            style={{
              transformOrigin: side > 0 ? "88% 14%" : "12% 14%",
              zIndex: visibleDepth - depth + 1,
            }}
          >
            <DeckPhoto
              source={source}
              alt=""
              sizes={sizes}
              quality={quality}
              loading={depth <= 2 ? "eager" : "lazy"}
              variant={index % 3}
            />
          </motion.div>
        );
      })}

      <motion.div
        data-deck-card="front"
        tabIndex={0}
        className={cn(
          "absolute inset-0 z-10 cursor-grab touch-pan-y overflow-hidden rounded-[inherit] drop-shadow-[0_20px_22px_rgba(15,23,42,.17)] outline-none select-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing dark:drop-shadow-[0_24px_28px_rgba(0,0,0,.46)]",
          cardClassName,
        )}
        style={{
          x: dragX,
          rotate: dragRotate,
          opacity: dragOpacity,
          scale: dragScale,
        }}
        drag={images.length > 1 && !moving ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.58}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 520, bounceDamping: 38 }}
        whileTap={images.length > 1 ? { cursor: "grabbing" } : undefined}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDrag={(_, info) => {
          if (Math.abs(info.offset.x) < 6) return;
          const previewDirection = info.offset.x < 0 ? 1 : -1;
          if (previewDirection !== direction) setDirection(previewDirection);
        }}
        onDragEnd={(_, info) => {
          const shouldMove =
            Math.abs(info.offset.x) > 74 || Math.abs(info.velocity.x) > 480;
          if (shouldMove) {
            void move(info.offset.x < 0 ? 1 : -1);
          } else {
            animate(dragX, 0, {
              type: "spring",
              stiffness: 520,
              damping: 38,
              mass: 0.68,
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
        <DeckPhoto
          source={selectedSource}
          alt={alt}
          sizes={sizes}
          quality={quality}
          priority={priority && selectedIndex === 0}
          loading={priority || selectedIndex === 0 ? "eager" : "lazy"}
          fetchPriority={priority && selectedIndex === 0 ? "high" : "auto"}
          variant={selectedIndex % 3}
          imageClassName={imageClassName}
        />

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

function DeckPhoto({
  source,
  alt,
  sizes,
  quality,
  loading,
  priority = false,
  fetchPriority = "auto",
  variant,
  imageClassName,
}: {
  source: string;
  alt: string;
  sizes: string;
  quality: number;
  loading: "eager" | "lazy";
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  variant: number;
  imageClassName?: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const image = imageRef.current;
    if (!image) return;

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setLoaded(true);
    };

    if (image.complete && image.naturalWidth > 0) {
      markReady();
    } else {
      image.addEventListener("load", markReady, { once: true });
      image.addEventListener("error", markReady, { once: true });
      void image.decode().then(markReady, markReady);
    }

    return () => {
      cancelled = true;
      image.removeEventListener("load", markReady);
      image.removeEventListener("error", markReady);
    };
  }, [source]);

  return (
    <PhotoSurface>
      {!loaded && <PhotoSkeleton variant={variant} />}
      <Image
        ref={imageRef}
        src={source}
        alt={alt}
        fill
        draggable={false}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={loading}
        fetchPriority={fetchPriority}
        className={cn(
          "pointer-events-none object-contain transition-[opacity,filter] duration-300 select-none",
          loaded ? "blur-0 opacity-100" : "opacity-0 blur-md",
          imageClassName,
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{ imageOrientation: "from-image" }}
      />
    </PhotoSurface>
  );
}

function PhotoSkeleton({ variant }: { variant: number }) {
  return (
    <div
      aria-hidden
      className="bg-muted pointer-events-none absolute inset-0 z-[1] overflow-hidden"
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
