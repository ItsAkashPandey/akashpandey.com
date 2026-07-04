"use client";

import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
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

function wrappedDistance(index: number, current: number, total: number) {
  const direct = Math.abs(index - current);
  return Math.min(direct, total - direct);
}

export default function StackedImageDeck({
  images,
  alt = "Image",
  className,
  cardClassName,
  imageClassName,
  sizes,
  priority = false,
  quality = 82,
  idleQuality: _idleQuality,
  showCounter = false,
  labels,
  gridBackground = false,
  stackSize: _stackSize,
  onImageClick,
}: StackedImageDeckProps) {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: false,
    dragFree: false,
    loop: images.length > 1,
    skipSnaps: false,
    duration: 24,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const imageRefs = useRef(new Map<number, HTMLImageElement>());
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const updateCarouselState = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateCarouselState();
    emblaApi.on("select", updateCarouselState);
    emblaApi.on("reInit", updateCarouselState);
    return () => {
      emblaApi.off("select", updateCarouselState);
      emblaApi.off("reInit", updateCarouselState);
    };
  }, [emblaApi, updateCarouselState]);

  useEffect(() => {
    if (!images.length) return;

    const nearIndexes = images
      .map((_, index) => index)
      .filter(
        (index) => wrappedDistance(index, selectedIndex, images.length) <= 2,
      );

    for (const index of nearIndexes) {
      const image = imageRefs.current.get(index);
      if (image?.decode) {
        void image.decode().catch(() => {
          // The load event will finish decoding if the request is still in flight.
        });
      }
    }
  }, [images, selectedIndex]);

  const visibleProgress = useMemo(() => {
    if (images.length <= 1) return 1;
    return (selectedIndex + 1) / images.length;
  }, [images.length, selectedIndex]);

  const openSelectedImage = useCallback(() => {
    onImageClick?.(selectedIndex);
  }, [onImageClick, selectedIndex]);

  if (images.length === 0) {
    return (
      <div className={cn("grid place-items-center", className)}>
        <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-xs">
          No images
        </div>
      </div>
    );
  }

  return (
    <div
      data-stacked-deck
      className={cn(
        "group/gallery border-border/60 bg-muted/30 relative isolate overflow-hidden rounded-[20px] border shadow-[0_12px_34px_rgba(15,23,42,0.10)]",
        className,
      )}
      style={
        gridBackground
          ? {
              backgroundImage:
                "linear-gradient(hsl(var(--border)/0.65) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.65) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }
          : undefined
      }
      role="button"
      tabIndex={0}
      aria-label={`Open ${alt}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          emblaApi?.scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          emblaApi?.scrollNext();
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSelectedImage();
        }
      }}
      onPointerDownCapture={(event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUpCapture={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (!start) return;

        const dx = Math.abs(event.clientX - start.x);
        const dy = Math.abs(event.clientY - start.y);
        if (dx <= 6 && dy <= 6) openSelectedImage();
      }}
    >
      <div ref={viewportRef} className="h-full overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {images.map((src, index) => {
            const distance = wrappedDistance(
              index,
              selectedIndex,
              images.length,
            );
            const isCurrent = index === selectedIndex;

            return (
              <div
                key={`${src}-${index}`}
                data-deck-card={isCurrent ? "front" : "slide"}
                data-deck-index={index}
                className="relative h-full min-w-0 flex-[0_0_100%]"
              >
                <div
                  className={cn(
                    "bg-muted relative h-full w-full overflow-hidden",
                    cardClassName,
                  )}
                >
                  <Image
                    ref={(node) => {
                      if (node) imageRefs.current.set(index, node);
                      else imageRefs.current.delete(index);
                    }}
                    src={src}
                    alt={isCurrent ? alt : ""}
                    fill
                    draggable={false}
                    sizes={sizes}
                    quality={quality}
                    loading={priority || distance <= 1 ? "eager" : "lazy"}
                    fetchPriority={
                      priority && index === 0
                        ? "high"
                        : distance <= 1
                          ? "auto"
                          : "low"
                    }
                    className={cn(
                      "pointer-events-none select-none",
                      imageClassName,
                    )}
                    style={{ imageOrientation: "from-image" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-1 ring-white/30 ring-inset dark:ring-white/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/45 via-black/12 to-transparent" />

      <div className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 z-20 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {labels?.[selectedIndex] ? (
            <span className="block max-w-[190px] truncate rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
              {labels[selectedIndex]}
            </span>
          ) : images.length > 1 ? (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/80">
              <span className="h-px w-4 bg-white/65" />
              swipe
            </span>
          ) : null}
        </div>

        {(showCounter || images.length > 1) && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white tabular-nums backdrop-blur-md">
            <Maximize2 className="size-2.5" />
            {selectedIndex + 1}/{images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[3px] bg-white/20">
            <div
              className="h-full origin-left bg-white transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${visibleProgress})` }}
            />
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              emblaApi?.scrollPrev();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            disabled={!canScrollPrev}
            className="pointer-events-auto absolute top-1/2 left-2 z-30 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover/gallery:opacity-100 hover:bg-black/55 sm:grid"
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
            onPointerDown={(event) => event.stopPropagation()}
            disabled={!canScrollNext}
            className="pointer-events-auto absolute top-1/2 right-2 z-30 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover/gallery:opacity-100 hover:bg-black/55 sm:grid"
            aria-label="Next image"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
