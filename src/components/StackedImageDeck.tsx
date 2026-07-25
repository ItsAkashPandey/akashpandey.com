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

export type DeckDirection = 1 | -1;

type DeckEntry = {
  depth: number;
  hidden?: boolean;
  index: number;
};

type DeckBounds = {
  height: number;
  width: number;
};

type PointerSession = {
  horizontal: boolean;
  lastTime: number;
  lastX: number;
  pointerId: number;
  startX: number;
  startY: number;
  velocityX: number;
};

const imageRatioCache = new Map<string, number>();
const SWIPE_DISTANCE = 72;
const SWIPE_VELOCITY = 550;

export function wrapDeckIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

export function resolveSwipeDirection(
  offsetX: number,
  velocityX: number,
  distanceThreshold = SWIPE_DISTANCE,
  velocityThreshold = SWIPE_VELOCITY,
): DeckDirection | null {
  if (Math.abs(offsetX) >= distanceThreshold) {
    return offsetX < 0 ? 1 : -1;
  }
  if (Math.abs(velocityX) >= velocityThreshold) {
    return velocityX < 0 ? 1 : -1;
  }
  return null;
}

export function getDeckEntries(
  selectedIndex: number,
  direction: DeckDirection,
  total: number,
  stackSize: number,
): DeckEntry[] {
  if (total <= 1) return [];

  const visibleDepth = Math.min(Math.max(0, stackSize - 1), total - 1, 3);
  const visible = Array.from(
    { length: visibleDepth },
    (_, offset): DeckEntry => ({
      depth: offset + 1,
      index: wrapDeckIndex(selectedIndex + direction * (offset + 1), total),
    }),
  );
  const warmIndex = wrapDeckIndex(selectedIndex - direction, total);

  if (!visible.some((entry) => entry.index === warmIndex)) {
    visible.push({
      depth: visibleDepth + 1,
      hidden: true,
      index: warmIndex,
    });
  }

  return visible.reverse();
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
  const [direction, setDirection] = useState<DeckDirection>(1);
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
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const draggedRef = useRef(false);
  const transitioningRef = useRef(false);
  const transitionTokenRef = useRef(0);
  const loadedImagesRef = useRef(new Set<string>());
  const imageWaitersRef = useRef(new Map<string, Set<() => void>>());
  const dispatchedReadyKeyRef = useRef("");
  const moveRequestRef = useRef(0);
  const moveFallbackRef = useRef<number | null>(null);
  const pointerRecoveryRef = useRef<number | null>(null);
  const moveAnimationRef = useRef<{ stop: () => void } | null>(null);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-150, 150], [-18, 18]);
  const dragOpacity = useTransform(dragX, [-150, 0, 150], [0.12, 1, 0.12]);
  const resolvedQuality = Math.max(quality, idleQuality);
  const imageSetKey = images.join("\u001f");
  const requiredHeroSources = useMemo(() => {
    if (!priority || !images.length) return new Set<string>();
    return new Set([
      images[0],
      images[wrapDeckIndex(1, images.length)],
      images[wrapDeckIndex(-1, images.length)],
    ]);
  }, [imageSetKey, images, priority]);

  const clearMoveFallback = useCallback(() => {
    if (moveFallbackRef.current !== null) {
      window.clearTimeout(moveFallbackRef.current);
      moveFallbackRef.current = null;
    }
  }, []);

  const clearPointerRecovery = useCallback(() => {
    if (pointerRecoveryRef.current !== null) {
      window.clearTimeout(pointerRecoveryRef.current);
      pointerRecoveryRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadedImagesRef.current.clear();
    imageWaitersRef.current.clear();
    dispatchedReadyKeyRef.current = "";
    moveRequestRef.current += 1;
    pointerSessionRef.current = null;
    transitioningRef.current = false;
    transitionTokenRef.current += 1;
    moveAnimationRef.current?.stop();
    moveAnimationRef.current = null;
    clearMoveFallback();
    clearPointerRecovery();
    dragX.set(0);
    setSelectedIndex(0);
    setDirection(1);

    if (priority && window.location.pathname === "/") {
      delete document.documentElement.dataset.heroDeckReady;
    }
  }, [clearMoveFallback, clearPointerRecovery, dragX, imageSetKey, priority]);

  useEffect(
    () => () => {
      transitionTokenRef.current += 1;
      moveRequestRef.current += 1;
      moveAnimationRef.current?.stop();
      imageWaitersRef.current.clear();
      clearMoveFallback();
      clearPointerRecovery();
    },
    [clearMoveFallback, clearPointerRecovery],
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
      imageWaitersRef.current.get(source)?.forEach((resolve) => resolve());
      imageWaitersRef.current.delete(source);

      if (
        !priority ||
        !Array.from(requiredHeroSources).every((requiredSource) =>
          loadedImagesRef.current.has(requiredSource),
        ) ||
        dispatchedReadyKeyRef.current === imageSetKey
      ) {
        return;
      }

      dispatchedReadyKeyRef.current = imageSetKey;
      document.documentElement.dataset.heroDeckReady = "true";
      window.dispatchEvent(new Event("hero-deck-ready"));
    },
    [imageSetKey, priority, requiredHeroSources],
  );

  const waitForImage = useCallback((source: string) => {
    if (loadedImagesRef.current.has(source)) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      let timer = 0;
      const finish = () => {
        window.clearTimeout(timer);
        resolve(true);
      };
      const waiters =
        imageWaitersRef.current.get(source) ?? new Set<() => void>();
      waiters.add(finish);
      imageWaitersRef.current.set(source, waiters);

      timer = window.setTimeout(() => {
        waiters.delete(finish);
        if (!waiters.size) imageWaitersRef.current.delete(source);
        resolve(false);
      }, 1_000);
    });
  }, []);

  const visibleDepth = Math.min(
    Math.max(0, stackSize - 1),
    Math.max(0, images.length - 1),
    3,
  );
  const backgroundCards = useMemo(
    () => getDeckEntries(selectedIndex, direction, images.length, stackSize),
    [direction, images.length, selectedIndex, stackSize],
  );

  const settleToCenter = useCallback(() => {
    moveAnimationRef.current?.stop();
    moveAnimationRef.current = animate(dragX, 0, {
      type: "spring",
      stiffness: 420,
      damping: 38,
      onComplete: () => {
        moveAnimationRef.current = null;
      },
    });
  }, [dragX]);

  const animateMove = useCallback(
    (nextDirection: DeckDirection) => {
      if (images.length <= 1 || transitioningRef.current) return;

      moveAnimationRef.current?.stop();
      clearMoveFallback();
      transitioningRef.current = true;
      setDirection(nextDirection);

      const token = ++transitionTokenRef.current;
      const exitDistance = Math.max(150, Math.min(260, bounds.width * 0.9));
      let finished = false;

      const finishMove = () => {
        if (
          finished ||
          token !== transitionTokenRef.current ||
          !transitioningRef.current
        ) {
          return;
        }
        finished = true;
        clearMoveFallback();
        moveAnimationRef.current = null;
        dragX.set(0);
        setSelectedIndex((current) =>
          wrapDeckIndex(current + nextDirection, images.length),
        );
        transitioningRef.current = false;
      };

      moveAnimationRef.current = animate(
        dragX,
        nextDirection === 1 ? -exitDistance : exitDistance,
        {
          duration: 0.18,
          ease: [0.22, 0.8, 0.24, 1],
          onComplete: finishMove,
        },
      );
      moveFallbackRef.current = window.setTimeout(() => {
        moveAnimationRef.current?.stop();
        finishMove();
      }, 280);
    },
    [bounds.width, clearMoveFallback, dragX, images.length],
  );

  const move = useCallback(
    async (nextDirection: DeckDirection) => {
      if (images.length <= 1 || transitioningRef.current) return;

      const request = ++moveRequestRef.current;
      const targetIndex = wrapDeckIndex(
        selectedIndex + nextDirection,
        images.length,
      );
      const targetSource = images[targetIndex];

      if (!loadedImagesRef.current.has(targetSource)) {
        setDirection(nextDirection);
        settleToCenter();
        const ready = await waitForImage(targetSource);
        if (
          !ready ||
          request !== moveRequestRef.current ||
          transitioningRef.current
        ) {
          return;
        }
      }

      animateMove(nextDirection);
    },
    [animateMove, images, selectedIndex, settleToCenter, waitForImage],
  );

  const finishPointer = useCallback(
    (pointerId: number, clientX: number, cancelled: boolean) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== pointerId) return;

      pointerSessionRef.current = null;
      clearPointerRecovery();

      const now = performance.now();
      const elapsed = Math.max(1, now - session.lastTime);
      const finalVelocity = ((clientX - session.lastX) / elapsed) * 1000;
      const velocityX =
        Math.abs(finalVelocity) > Math.abs(session.velocityX)
          ? finalVelocity
          : session.velocityX;
      const offsetX = clientX - session.startX;
      const nextDirection =
        !cancelled && session.horizontal
          ? resolveSwipeDirection(offsetX, velocityX)
          : null;

      if (nextDirection) {
        move(nextDirection);
      } else {
        settleToCenter();
      }

      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    },
    [clearPointerRecovery, move, settleToCenter],
  );

  const schedulePointerRecovery = useCallback(() => {
    clearPointerRecovery();
    pointerRecoveryRef.current = window.setTimeout(() => {
      const session = pointerSessionRef.current;
      if (session) {
        finishPointer(session.pointerId, session.lastX, false);
      }
    }, 900);
  }, [clearPointerRecovery, finishPointer]);

  const updatePointer = useCallback(
    (pointerId: number, clientX: number, clientY: number) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== pointerId) return;

      const offsetX = clientX - session.startX;
      const offsetY = clientY - session.startY;
      if (!session.horizontal) {
        if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) < 6) return;
        if (Math.abs(offsetY) > Math.abs(offsetX)) return;
        session.horizontal = true;
        draggedRef.current = true;
      }

      const now = performance.now();
      const elapsed = Math.max(1, now - session.lastTime);
      const velocityX = ((clientX - session.lastX) / elapsed) * 1000;
      session.velocityX = session.velocityX * 0.35 + velocityX * 0.65;
      session.lastTime = now;
      session.lastX = clientX;
      schedulePointerRecovery();

      const previewDirection: DeckDirection = offsetX < 0 ? 1 : -1;
      setDirection(previewDirection);

      const dragLimit = Math.max(120, bounds.width);
      const constrainedOffset =
        Math.abs(offsetX) <= dragLimit
          ? offsetX
          : Math.sign(offsetX) *
            (dragLimit + (Math.abs(offsetX) - dragLimit) * 0.18);
      dragX.set(constrainedOffset);
    },
    [bounds.width, dragX, schedulePointerRecovery],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event.pointerId, event.clientX, event.clientY);
    };
    const handlePointerUp = (event: PointerEvent) => {
      finishPointer(event.pointerId, event.clientX, false);
    };
    const handlePointerCancel = (event: PointerEvent) => {
      finishPointer(event.pointerId, event.clientX, true);
    };
    const handleMouseUp = (event: MouseEvent) => {
      const session = pointerSessionRef.current;
      if (session) finishPointer(session.pointerId, event.clientX, false);
    };
    const handleBlur = () => {
      const session = pointerSessionRef.current;
      if (session) finishPointer(session.pointerId, session.lastX, true);
    };

    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerCancel, true);
    window.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("pointercancel", handlePointerCancel, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("blur", handleBlur);
    };
  }, [finishPointer, updatePointer]);

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
  const selectedRatio =
    ratios[selectedSource] ?? imageWidth / Math.max(1, imageHeight);
  const selectedCardSize = fitInsideDeck(selectedRatio, bounds);

  const renderPhoto = (
    source: string,
    isFront: boolean,
    eagerNeighbor = false,
  ) => {
    const eager = priority && (isFront || eagerNeighbor);

    return (
      <Image
        src={source}
        alt={isFront ? alt : ""}
        fill
        draggable={false}
        sizes={sizes}
        quality={resolvedQuality}
        priority={priority && isFront}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : isFront ? "auto" : "low"}
        decoding="async"
        className={cn(
          "h-full w-full rounded-[inherit] object-contain select-none",
          isFront && imageClassName,
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
        onError={() => markImageReady(source)}
      />
    );
  };

  return (
    <div
      ref={deckRef}
      data-stacked-deck
      data-deck-index={selectedIndex}
      className={cn(
        "group/gallery relative isolate grid place-items-center",
        className,
      )}
      role="region"
      aria-label={`${alt} gallery`}
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;

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
      {backgroundCards.map(({ depth, hidden, index }) => {
        const source = images[index];
        const backRotation = index % 2 ? 6 : -6;
        const stackScale = Math.max(0.85, 0.94 - depth * 0.04);
        const ratio = ratios[source] ?? imageWidth / Math.max(1, imageHeight);
        const cardSize = fitInsideDeck(ratio, bounds);
        const eagerNeighbor =
          index === wrapDeckIndex(selectedIndex + 1, images.length) ||
          index === wrapDeckIndex(selectedIndex - 1, images.length);

        return (
          <div
            key={`back-${index}-${source}`}
            className="pointer-events-none absolute inset-0 grid place-items-center"
            style={{ zIndex: hidden ? 0 : visibleDepth - depth + 5 }}
          >
            <motion.div
              data-deck-card="back"
              aria-hidden
              className="relative origin-bottom overflow-hidden rounded-md bg-transparent select-none"
              style={{
                ...cardSize,
                opacity: hidden ? 0 : 1,
                rotate: hidden ? 0 : backRotation,
              }}
              initial={false}
              animate={{ scale: hidden ? 0.9 : stackScale }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 40,
              }}
            >
              {renderPhoto(source, false, eagerNeighbor)}
            </motion.div>
          </div>
        );
      })}

      <motion.div
        data-deck-card="front"
        tabIndex={0}
        className={cn(
          "relative z-20 origin-bottom cursor-grab touch-pan-y overflow-hidden rounded-md bg-transparent shadow-[0_12px_24px_-8px_rgba(12,35,36,.42)] outline-none select-none focus-visible:ring-2 focus-visible:ring-teal-500 active:cursor-grabbing dark:shadow-[0_14px_28px_-8px_rgba(0,0,0,.68)]",
          cardClassName,
        )}
        style={{
          ...selectedCardSize,
          x: dragX,
          opacity: dragOpacity,
          rotate: dragRotate,
          willChange: "transform, opacity",
        }}
        onPointerDown={(event) => {
          if (
            images.length <= 1 ||
            transitioningRef.current ||
            !event.isPrimary ||
            (event.pointerType === "mouse" && event.button !== 0)
          ) {
            return;
          }

          const interruptedSession = pointerSessionRef.current;
          if (interruptedSession) {
            finishPointer(
              interruptedSession.pointerId,
              interruptedSession.lastX,
              true,
            );
          }
          moveRequestRef.current += 1;
          moveAnimationRef.current?.stop();
          moveAnimationRef.current = null;
          dragX.set(0);
          draggedRef.current = false;
          pointerSessionRef.current = {
            horizontal: false,
            lastTime: performance.now(),
            lastX: event.clientX,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            velocityX: 0,
          };
          schedulePointerRecovery();
        }}
        onClick={() => {
          if (!draggedRef.current) {
            onImageClick?.(selectedIndex);
          }
        }}
      >
        {renderPhoto(selectedSource, true)}

        {(labels?.[selectedIndex] || showCounter || images.length > 1) && (
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
