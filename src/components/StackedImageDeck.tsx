"use client";

import { preloadBrowserImage } from "@/lib/browser-image-cache";
import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
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
  showCounter?: boolean;
  labels?: string[];
  /** Photos read best cropped; posters and figures must not be. */
  fit?: "cover" | "contain";
  stackSize?: number;
  onImageClick?: (index: number) => void;
}

/** Past this many pixels of horizontal travel the card leaves the stack. */
const THROW_THRESHOLD = 100;

export function wrapDeckIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

type CardProps = {
  source: string;
  alt: string;
  label?: string;
  counter?: string;
  depth: number;
  isFront: boolean;
  tiltSeed: number;
  fit: "cover" | "contain";
  imageWidth: number;
  imageHeight: number;
  sizes: string;
  quality: number;
  priority: boolean;
  cardClassName?: string;
  imageClassName?: string;
  onThrow: () => void;
  onOpen: () => void;
};

function DeckCard({
  source,
  alt,
  label,
  counter,
  depth,
  isFront,
  tiltSeed,
  fit,
  imageWidth,
  imageHeight,
  sizes,
  quality,
  priority,
  cardClassName,
  imageClassName,
  onThrow,
  onOpen,
}: CardProps) {
  const x = useMotionValue(0);
  const rotateRaw = useTransform(x, [-150, 150], [-18, 18]);
  const opacity = useTransform(x, [-160, 0, 160], [0, 1, 0]);
  const draggedRef = useRef(false);

  // Cards behind the front one keep a fixed tilt so the stack reads as paper.
  const rotate = useTransform(() => {
    const offset = isFront ? 0 : tiltSeed % 2 ? 6 : -6;
    return `${rotateRaw.get() + offset}deg`;
  });

  // A card that gets recycled to the back must not carry its thrown offset.
  useEffect(() => {
    if (!isFront) x.set(0);
  }, [isFront, x]);

  const handleDragEnd = (
    _event: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const thrown =
      Math.abs(info.offset.x) > THROW_THRESHOLD ||
      Math.abs(info.velocity.x) > 500;

    if (!thrown) {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
      return;
    }

    const direction = info.offset.x < 0 ? -1 : 1;
    void animate(x, direction * 420, {
      type: "spring",
      stiffness: 320,
      damping: 42,
    }).then(() => {
      onThrow();
    });
  };

  return (
    <motion.div
      className={cn(
        "absolute inset-0 origin-bottom overflow-hidden rounded-lg",
        isFront && "cursor-grab active:cursor-grabbing",
        cardClassName,
      )}
      style={{
        gridRow: 1,
        gridColumn: 1,
        x,
        opacity,
        rotate,
        zIndex: 100 - depth,
        boxShadow: isFront
          ? "0 14px 26px -8px rgb(12 35 36 / 0.42), 0 4px 8px -4px rgb(12 35 36 / 0.3)"
          : "0 8px 18px -10px rgb(12 35 36 / 0.3)",
      }}
      animate={{ scale: isFront ? 1 : Math.max(0.85, 0.94 - depth * 0.04) }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: -160, right: 160, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={() => {
        draggedRef.current = true;
      }}
      onDragEnd={handleDragEnd}
      onPointerUp={() => {
        // A throw and a tap share the same pointer sequence; only the tap opens.
        if (!draggedRef.current && isFront) onOpen();
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }}
    >
      <Image
        src={source}
        alt={isFront ? alt : ""}
        width={imageWidth}
        height={imageHeight}
        sizes={sizes}
        quality={quality}
        priority={priority && isFront}
        loading={priority && depth < 2 ? "eager" : "lazy"}
        fetchPriority={isFront ? "high" : "low"}
        decoding="async"
        draggable={false}
        className={cn(
          "pointer-events-none h-full w-full select-none",
          fit === "cover" ? "object-cover" : "object-contain",
          imageClassName,
        )}
      />

      {(label || counter) && (
        <>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 flex items-end justify-between gap-2">
            {label ? (
              <span className="min-w-0 truncate rounded-[4px] bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                {label}
              </span>
            ) : (
              <span />
            )}
            {counter && (
              <span className="shrink-0 rounded-[4px] bg-black/55 px-2 py-1 text-[10px] font-semibold text-white tabular-nums backdrop-blur-sm">
                {counter}
              </span>
            )}
          </span>
        </>
      )}
    </motion.div>
  );
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
  showCounter = false,
  labels,
  fit = "cover",
  stackSize = 4,
  onImageClick,
}: StackedImageDeckProps) {
  const imageSetKey = images.join("");

  // The last entry is the front card, matching the visual stacking order.
  const [order, setOrder] = useState<number[]>(() =>
    images.map((_, index) => index).reverse(),
  );

  useEffect(() => {
    setOrder(images.map((_, index) => index).reverse());
  }, [imageSetKey, images]);

  const frontIndex = order[order.length - 1] ?? 0;

  // Thrown cards return to the back of the stack, so the deck never dead-ends.
  const recycle = useCallback(() => {
    setOrder((previous) => {
      if (previous.length < 2) return previous;
      const next = previous.slice();
      const front = next.pop()!;
      next.unshift(front);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!images.length) return;
    const upcoming = [
      images[frontIndex],
      images[wrapDeckIndex(frontIndex + 1, images.length)],
    ];
    void Promise.all(upcoming.map(preloadBrowserImage));
  }, [images, imageSetKey, frontIndex]);

  const readyKeyRef = useRef("");
  useEffect(() => {
    if (!priority || !images.length || readyKeyRef.current === imageSetKey) {
      return;
    }

    let cancelled = false;
    void Promise.all(images.slice(0, 2).map(preloadBrowserImage)).then(() => {
      if (cancelled || readyKeyRef.current === imageSetKey) return;
      readyKeyRef.current = imageSetKey;
      document.documentElement.dataset.heroDeckReady = "true";
      window.dispatchEvent(new Event("hero-deck-ready"));
    });

    return () => {
      cancelled = true;
    };
  }, [imageSetKey, images, priority]);

  const visible = useMemo(() => {
    const depth = Math.min(stackSize, order.length);
    return order.slice(order.length - depth);
  }, [order, stackSize]);

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
      data-stacked-deck
      data-deck-index={frontIndex}
      className={cn("relative grid touch-pan-y place-items-center", className)}
      role="region"
      aria-label={`${alt} gallery, drag to browse`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          recycle();
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onImageClick?.(frontIndex);
        }
      }}
    >
      {visible.map((index, position) => {
        const depth = visible.length - 1 - position;
        return (
          <DeckCard
            key={`${index}-${images[index]}`}
            source={images[index]}
            alt={alt}
            label={labels?.[index]}
            counter={
              showCounter || images.length > 1
                ? `${index + 1}/${images.length}`
                : undefined
            }
            depth={depth}
            isFront={depth === 0}
            tiltSeed={index}
            fit={fit}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            sizes={sizes}
            quality={quality}
            priority={priority}
            cardClassName={cardClassName}
            imageClassName={imageClassName}
            onThrow={recycle}
            onOpen={() => onImageClick?.(index)}
          />
        );
      })}
    </div>
  );
}
