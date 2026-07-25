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

type DeckEntry = {
  depth: number;
  hidden?: boolean;
  index: number;
};

type DeckBounds = {
  height: number;
  width: number;
};

const imageRatioCache = new Map<string, number>();

function wrapIndex(index: number, total: number) {
  return ((index % total) + total) % total;
}

function fitInsideDeck(ratio: number, bounds: DeckBounds) {
  if (!bounds.width || !bounds.height) {
    return { height: "100%", width: "100%" };
  }

  const deckRatio = bounds.width / bounds.height;
  if (ratio >= deckRatio) {
    return {
      height: Math.max(1, bounds.width / ratio),
      width: bounds.width,
    };
  }

  return {
    height: bounds.height,
    width: Math.max(1, bounds.height * ratio),
  };
}

export default function StackedImageDeck({
  images,
  alt = "Image",
  className,
  cardClassName,
  imageClassName,
  imageWidth,
  imageHeight,
  sizes,
  priority = false,
  quality = 82,
  idleQuality = 72,
  showCounter = false,
  labels,
  stackSize = 4,
  onImageClick,
}: StackedImageDeckProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [bounds, setBounds] = useState<DeckBounds>({ height: 0, width: 0 });
  const [ratios, setRatios] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      images.flatMap((source) => {
        const ratio = imageRatioCache.get(source);
        return ratio ? [[source, ratio]] : [];
      }),
    ),
  );
  const deckRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef(false);
  const draggedRef = useRef(false);
  const loadedImagesRef = useRef(new Set<string>());
  const dispatchedReadyKeyRef = useRef("");
  const moveFallbackRef = useRef<number | null>(null);
  const moveAnimationRef = useRef<{ stop: () => void } | null>(null);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-150, 150], [-18, 18]);
  const dragOpacity = useTransform(dragX, [-100, 0, 100], [0, 1, 0]);
  const resolvedQuality = Math.max(quality, idleQuality);
  const imageSetKey = images.join("\u001f");
  const uniqueImageCount = new Set(images).size;

  useEffect(() => {
    loadedImagesRef.current.clear();
    dispatchedReadyKeyRef.current = "";

    if (priority && window.location.pathname === "/") {
      delete document.documentElement.dataset.heroDeckReady;
    }
  }, [imageSetKey, priority]);

  useEffect(
    () => () => {
      moveAnimationRef.current?.stop();
      if (moveFallbackRef.current !== null) {
        window.clearTimeout(moveFallbackRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const measure = () => {
      const rect = deck.getBoundingClientRect();
      setBounds((current) => {
        const next = {
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        };
        return current.height === next.height && current.width === next.width
          ? current
          : next;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(deck);
    return () => observer.disconnect();
  }, []);

  const rememberRatio = useCallback((source: string, ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    imageRatioCache.set(source, ratio);
    setRatios((current) =>
      current[source] === ratio ? current : { ...current, [source]: ratio },
    );
  }, []);

  const markImageReady = useCallback(
    (source: string) => {
      loadedImagesRef.current.add(source);
      if (
        !priority ||
        loadedImagesRef.current.size < uniqueImageCount ||
        dispatchedReadyKeyRef.current === imageSetKey
      ) {
        return;
      }

      dispatchedReadyKeyRef.current = imageSetKey;
      document.documentElement.dataset.heroDeckReady = "true";
      window.dispatchEvent(new Event("hero-deck-ready"));
    },
    [imageSetKey, priority, uniqueImageCount],
  );

  const visibleDepth = Math.min(
    Math.max(0, stackSize - 1),
    Math.max(0, images.length - 1),
    3,
  );

  const cards = useMemo(() => {
    if (!images.length) return [];

    const visible = Array.from(
      { length: visibleDepth + 1 },
      (_, depth): DeckEntry => ({
        depth,
        index: wrapIndex(selectedIndex + direction * depth, images.length),
      }),
    );
    const warmIndex = wrapIndex(selectedIndex - direction, images.length);
    const rendered = [...visible].reverse();

    if (!visible.some((entry) => entry.index === warmIndex)) {
      rendered.unshift({
        depth: visibleDepth + 1,
        hidden: true,
        index: warmIndex,
      });
    }

    return rendered;
  }, [direction, images.length, selectedIndex, visibleDepth]);

  const commitMove = useCallback(
    (nextDirection: Direction) => {
      dragX.set(0);
      setDirection(nextDirection);
      setSelectedIndex((current) =>
        wrapIndex(current + nextDirection, images.length),
      );
    },
    [dragX, images.length],
  );

  const move = useCallback(
    (nextDirection: Direction) => {
      if (images.length <= 1 || movingRef.current) return;

      movingRef.current = true;
      setDirection(nextDirection);
      let finished = false;
      const finishMove = () => {
        if (finished) return;
        finished = true;
        moveAnimationRef.current?.stop();
        moveAnimationRef.current = null;
        if (moveFallbackRef.current !== null) {
          window.clearTimeout(moveFallbackRef.current);
          moveFallbackRef.current = null;
        }
        commitMove(nextDirection);
        movingRef.current = false;
      };

      moveAnimationRef.current = animate(
        dragX,
        nextDirection === 1 ? -150 : 150,
        {
          duration: 0.18,
          ease: [0.22, 0.8, 0.24, 1],
          onComplete: finishMove,
        },
      );
      moveFallbackRef.current = window.setTimeout(finishMove, 260);
    },
    [commitMove, dragX, images.length],
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

  return (
    <div
      ref={deckRef}
      data-stacked-deck
      className={cn(
        "group/gallery relative isolate grid place-items-center",
        className,
      )}
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
      {cards.map(({ depth, hidden, index }) => {
        const source = images[index];
        const isFront = depth === 0;
        const backRotation = index % 2 ? 6 : -6;
        const stackScale = isFront ? 1 : Math.max(0.85, 0.94 - depth * 0.04);
        const ratio = ratios[source] ?? imageWidth / Math.max(1, imageHeight);
        const cardSize = fitInsideDeck(ratio, bounds);

        return (
          <div
            key={`${index}-${source}`}
            className="pointer-events-none absolute inset-0 grid place-items-center"
            style={{
              zIndex: isFront ? 20 : hidden ? 0 : visibleDepth - depth + 5,
            }}
          >
            <motion.div
              data-deck-card={isFront ? "front" : "back"}
              tabIndex={isFront ? 0 : -1}
              aria-hidden={!isFront}
              className={cn(
                "relative origin-bottom overflow-hidden rounded-md bg-transparent outline-none select-none",
                isFront
                  ? "pointer-events-auto cursor-grab touch-pan-y shadow-[0_12px_24px_-8px_rgba(12,35,36,.42)] focus-visible:ring-2 focus-visible:ring-teal-500 active:cursor-grabbing dark:shadow-[0_14px_28px_-8px_rgba(0,0,0,.68)]"
                  : "pointer-events-none",
                isFront && cardClassName,
              )}
              style={
                isFront
                  ? {
                      ...cardSize,
                      x: dragX,
                      opacity: dragOpacity,
                      rotate: dragRotate,
                      willChange: "transform, opacity",
                    }
                  : {
                      ...cardSize,
                      opacity: hidden ? 0 : 1,
                      rotate: hidden ? 0 : backRotation,
                    }
              }
              initial={false}
              animate={{ scale: hidden ? 0.9 : stackScale }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 40,
              }}
              drag={isFront && images.length > 1 ? "x" : false}
              dragConstraints={{ left: -150, right: 150 }}
              dragMomentum={false}
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
                  Math.abs(info.offset.x) > 100 ||
                  Math.abs(info.velocity.x) > 650;

                if (shouldMove) {
                  const gestureX =
                    Math.abs(info.offset.x) > 24
                      ? info.offset.x
                      : info.velocity.x;
                  commitMove(gestureX < 0 ? 1 : -1);
                } else {
                  animate(dragX, 0, {
                    type: "spring",
                    stiffness: 400,
                    damping: 40,
                  });
                }

                window.setTimeout(() => {
                  draggedRef.current = false;
                }, 0);
              }}
              onClick={() => {
                if (isFront && !draggedRef.current) {
                  onImageClick?.(selectedIndex);
                }
              }}
            >
              <Image
                src={source}
                alt={isFront ? alt : ""}
                fill
                draggable={false}
                sizes={sizes}
                quality={resolvedQuality}
                priority={priority}
                loading="eager"
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                className={cn(
                  "h-full w-full rounded-[inherit] object-contain select-none",
                  imageClassName,
                )}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  rememberRatio(
                    source,
                    image.naturalWidth / Math.max(1, image.naturalHeight),
                  );
                  void image
                    .decode()
                    .catch(() => undefined)
                    .finally(() => markImageReady(source));
                }}
              />

              {isFront &&
                (labels?.[selectedIndex] ||
                  showCounter ||
                  images.length > 1) && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent" />
                    <div className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 flex items-end justify-between gap-2">
                      {labels?.[selectedIndex] ? (
                        <span className="min-w-0 truncate rounded-md bg-black/52 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                          {labels[selectedIndex]}
                        </span>
                      ) : (
                        <span />
                      )}
                      {(showCounter || images.length > 1) && (
                        <span
                          data-deck-counter
                          className="shrink-0 rounded-md bg-black/52 px-2 py-1 text-[10px] font-semibold text-white tabular-nums backdrop-blur-sm"
                        >
                          {selectedIndex + 1}/{images.length}
                        </span>
                      )}
                    </div>
                  </>
                )}
            </motion.div>
          </div>
        );
      })}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              move(-1);
            }}
            className="absolute top-1/2 left-2 z-30 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-zinc-950/58 text-white opacity-0 shadow-md backdrop-blur-sm transition duration-150 group-hover/gallery:opacity-100 hover:bg-zinc-950/80 active:scale-95 sm:grid"
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
            className="absolute top-1/2 right-2 z-30 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-zinc-950/58 text-white opacity-0 shadow-md backdrop-blur-sm transition duration-150 group-hover/gallery:opacity-100 hover:bg-zinc-950/80 active:scale-95 sm:grid"
            aria-label="Next image"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
