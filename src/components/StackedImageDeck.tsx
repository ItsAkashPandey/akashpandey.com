"use client";

import { preloadBrowserImage } from "@/lib/browser-image-cache";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
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

type DeckBounds = {
  height: number;
  width: number;
};

const imageRatioCache = new Map<string, number>();

export function wrapDeckIndex(index: number, total: number) {
  if (total <= 0) return 0;
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

function repeatedIndexes(total: number) {
  if (total <= 0) return [];
  return Array.from({ length: total }, (_, index) => index);
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
  const imageSetKey = images.join("\u001f");
  const slideIndexes = useMemo(
    () => repeatedIndexes(images.length),
    [images.length],
  );
  const initialSlide = 0;
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    duration: 28,
    loop: images.length > 1,
    skipSnaps: false,
    startIndex: initialSlide,
  });
  const deckRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const readyKeyRef = useRef("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [bounds, setBounds] = useState<DeckBounds>({ height: 0, width: 0 });
  const [ratios, setRatios] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      images.flatMap((source) => {
        const ratio = imageRatioCache.get(source);
        return ratio ? [[source, ratio]] : [];
      }),
    ),
  );

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const measure = () => {
      const rect = deck.getBoundingClientRect();
      const next = {
        height: Math.round(rect.height),
        width: Math.round(rect.width),
      };
      setBounds((current) =>
        current.height === next.height && current.width === next.width
          ? current
          : next,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(deck);
    return () => observer.disconnect();
  }, []);

  const syncSelected = useCallback(() => {
    if (!emblaApi || !slideIndexes.length) return;
    const snap = emblaApi.selectedScrollSnap();
    setSelectedIndex(slideIndexes[snap] ?? 0);
  }, [emblaApi, slideIndexes]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", syncSelected);
    emblaApi.on("reInit", syncSelected);
    syncSelected();
    return () => {
      emblaApi.off("select", syncSelected);
      emblaApi.off("reInit", syncSelected);
    };
  }, [emblaApi, syncSelected]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({
      align: "center",
      containScroll: false,
      duration: 24,
      loop: images.length > 1,
      skipSnaps: false,
      startIndex: initialSlide,
    });
    emblaApi.scrollTo(initialSlide, true);
    setSelectedIndex(0);
  }, [emblaApi, imageSetKey, images.length, initialSlide]);

  useEffect(() => {
    if (!images.length) return;
    const neighbours = [
      images[selectedIndex],
      images[wrapDeckIndex(selectedIndex + 1, images.length)],
      images[wrapDeckIndex(selectedIndex - 1, images.length)],
    ];
    void Promise.all(neighbours.map(preloadBrowserImage));
  }, [images, imageSetKey, selectedIndex]);

  useEffect(() => {
    if (!priority || !images.length || readyKeyRef.current === imageSetKey) {
      return;
    }

    let cancelled = false;
    const sources = [
      images[0],
      images[wrapDeckIndex(1, images.length)],
      images[wrapDeckIndex(-1, images.length)],
    ];

    void Promise.all(sources.map(preloadBrowserImage)).then(() => {
      if (cancelled || readyKeyRef.current === imageSetKey) return;
      readyKeyRef.current = imageSetKey;
      document.documentElement.dataset.heroDeckReady = "true";
      window.dispatchEvent(new Event("hero-deck-ready"));
    });

    return () => {
      cancelled = true;
    };
  }, [imageSetKey, images, priority]);

  const rememberRatio = useCallback((source: string, ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    imageRatioCache.set(source, ratio);
    setRatios((current) =>
      current[source] === ratio ? current : { ...current, [source]: ratio },
    );
  }, []);

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
  const fallbackRatio = imageWidth / Math.max(1, imageHeight);
  const visibleStack = Math.min(
    Math.max(0, stackSize - 1),
    images.length - 1,
    3,
  );

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
          emblaApi?.scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          emblaApi?.scrollNext();
        }
      }}
    >
      {Array.from({ length: visibleStack }, (_, offset) => {
        const depth = visibleStack - offset;
        const index = wrapDeckIndex(selectedIndex + depth, images.length);
        const source = images[index];
        const ratio = ratios[source] ?? fallbackRatio;
        const cardSize = fitInsideDeck(ratio, bounds);

        return (
          <div
            key={`stack-${depth}-${source}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 grid place-items-center"
            style={{ zIndex: 2 + offset }}
          >
            <div
              className="relative overflow-hidden rounded-[4px] bg-transparent opacity-70"
              style={{
                ...cardSize,
                transform: `translateY(${depth * 2}px) rotate(${index % 2 ? 4 : -4}deg) scale(${1 - depth * 0.035})`,
              }}
            >
              <Image
                src={source}
                alt=""
                fill
                draggable={false}
                sizes={sizes}
                quality={Math.max(quality, idleQuality)}
                loading="lazy"
                decoding="async"
                className="object-contain select-none"
              />
            </div>
          </div>
        );
      })}

      <div
        ref={viewportRef}
        className="absolute inset-0 z-20 overflow-hidden"
        onPointerDown={(event) => {
          pointerStartRef.current = { x: event.clientX, y: event.clientY };
          draggedRef.current = false;
        }}
        onPointerMove={(event) => {
          const start = pointerStartRef.current;
          if (!start) return;
          if (
            Math.abs(event.clientX - start.x) > 7 ||
            Math.abs(event.clientY - start.y) > 7
          ) {
            draggedRef.current = true;
          }
        }}
        onPointerUp={() => {
          pointerStartRef.current = null;
          window.setTimeout(() => {
            draggedRef.current = false;
          }, 0);
        }}
        onPointerCancel={() => {
          pointerStartRef.current = null;
          draggedRef.current = false;
        }}
      >
        <div className="flex h-full touch-pan-y">
          {slideIndexes.map((index, slideIndex) => {
            const source = images[index];
            const ratio = ratios[source] ?? fallbackRatio;
            const cardSize = fitInsideDeck(ratio, bounds);
            const isSelected =
              source === selectedSource && index === selectedIndex;
            const eager =
              priority &&
              (index === 0 ||
                index === wrapDeckIndex(1, images.length) ||
                index === wrapDeckIndex(-1, images.length));

            return (
              <div
                key={`${slideIndex}-${source}`}
                className="flex h-full min-w-0 flex-[0_0_100%] items-center justify-center"
              >
                <button
                  type="button"
                  tabIndex={isSelected ? 0 : -1}
                  aria-label={`Open ${alt} ${index + 1} of ${images.length}`}
                  className={cn(
                    "relative block shrink-0 cursor-grab overflow-hidden rounded-[4px] border-0 bg-transparent p-0 shadow-[0_12px_24px_-8px_rgba(12,35,36,.38)] outline-none select-none active:cursor-grabbing dark:shadow-[0_14px_28px_-8px_rgba(0,0,0,.62)]",
                    cardClassName,
                  )}
                  style={cardSize}
                  onClick={() => {
                    if (!draggedRef.current) onImageClick?.(index);
                  }}
                >
                  <Image
                    src={source}
                    alt={isSelected ? alt : ""}
                    fill
                    draggable={false}
                    sizes={sizes}
                    quality={Math.max(quality, idleQuality)}
                    priority={priority && index === 0}
                    loading={eager ? "eager" : "lazy"}
                    fetchPriority={eager ? "high" : "auto"}
                    decoding="async"
                    className={cn(
                      "h-full w-full object-contain select-none",
                      isSelected && imageClassName,
                    )}
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      rememberRatio(
                        source,
                        image.naturalWidth / Math.max(1, image.naturalHeight),
                      );
                    }}
                  />

                  {(labels?.[index] || showCounter || images.length > 1) && (
                    <>
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/46 to-transparent" />
                      <span className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 flex items-end justify-between gap-2">
                        {labels?.[index] ? (
                          <span className="min-w-0 truncate rounded-[4px] bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                            {labels[index]}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="shrink-0 rounded-[4px] bg-black/55 px-2 py-1 text-[10px] font-semibold text-white tabular-nums backdrop-blur-sm">
                          {index + 1}/{images.length}
                        </span>
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              emblaApi?.scrollPrev();
            }}
            className="absolute top-1/2 left-2 z-30 hidden size-8 -translate-y-1/2 place-items-center rounded-full border-0 bg-zinc-950/58 text-white opacity-0 shadow-md backdrop-blur-sm transition duration-150 group-hover/gallery:opacity-100 hover:bg-zinc-950/80 active:scale-95 sm:grid"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              emblaApi?.scrollNext();
            }}
            className="absolute top-1/2 right-2 z-30 hidden size-8 -translate-y-1/2 place-items-center rounded-full border-0 bg-zinc-950/58 text-white opacity-0 shadow-md backdrop-blur-sm transition duration-150 group-hover/gallery:opacity-100 hover:bg-zinc-950/80 active:scale-95 sm:grid"
            aria-label="Next image"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
