"use client";

import { preloadBrowserImage } from "@/lib/browser-image-cache";
import { cn } from "@/lib/utils";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
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
  showCounter?: boolean;
  labels?: string[];
  /** Photos read best cropped; posters and figures must not be. */
  fit?: "cover" | "contain";
  stackSize?: number;
  onImageClick?: (index: number) => void;
}

/** Past this many pixels of horizontal travel the card leaves the stack. */
const THROW_THRESHOLD = 90;
/** Movement under this counts as a tap, so the lightbox still opens. */
const TAP_SLOP = 6;

/**
 * One optical size for every deck on the site. Orientation changes, area does
 * not, so a portrait photo and a landscape poster carry the same visual weight
 * on whichever page they appear.
 */
export const DECK_SIZE = {
  portrait: "h-[264px] w-[198px]",
  landscape: "h-[198px] w-[264px]",
} as const;

export function wrapDeckIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

type CardChrome = {
  source: string;
  alt: string;
  label?: string;
  counter?: string;
  fit: "cover" | "contain";
  imageWidth: number;
  imageHeight: number;
  sizes: string;
  quality: number;
  priority: boolean;
  imageClassName?: string;
};

function CardFace({
  source,
  alt,
  label,
  counter,
  fit,
  imageWidth,
  imageHeight,
  sizes,
  quality,
  priority,
  imageClassName,
}: CardChrome) {
  return (
    <>
      <Image
        src={source}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        sizes={sizes}
        quality={quality}
        priority={priority}
        // Deck cards live inside an animated (transform: x/rotate/scale)
        // ancestor at all times. Chromium never fires the lazy-load
        // intersection check for an <img> whose ancestor has a transform, so
        // `loading="lazy"` here just means "never loads" — the image quietly
        // disappears instead of paining the frame. Mounting is already
        // gated upstream (only a handful of cards exist in the DOM per deck,
        // and decks only mount once their section is visible), so eager is
        // safe and is what actually gets pixels on screen.
        loading="eager"
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        draggable={false}
        className={cn(
          "pointer-events-none h-full w-full select-none",
          fit === "cover" ? "object-cover" : "object-contain",
          imageClassName,
        )}
      />

      {counter && (
        <span className="deck-count pointer-events-none absolute top-2.5 right-2.5">
          {counter}
        </span>
      )}

      {label && (
        <>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 max-w-[calc(100%-5.5rem)] truncate rounded-[4px] bg-black/45 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            {label}
          </span>
        </>
      )}
    </>
  );
}

const CARD_BASE =
  "absolute inset-0 origin-bottom overflow-hidden rounded-lg [grid-area:1/1]";

/**
 * The card behind the front one. Static, never grabbable, and unaware of any
 * gesture — it exists to give the stack its depth and paper edges.
 */
function BackCard({
  depth,
  tiltSeed,
  cardClassName,
  ...chrome
}: CardChrome & { depth: number; tiltSeed: number; cardClassName?: string }) {
  return (
    <motion.div
      className={cn(CARD_BASE, "pointer-events-none", cardClassName)}
      style={{
        zIndex: 100 - depth,
        boxShadow: "0 8px 18px -10px rgb(12 35 36 / 0.3)",
      }}
      // A card that has just been thrown rejoins the stack here while its
      // thrown copy is still flying off. Fading in turns what would read as a
      // duplicate into a crossfade.
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        scale: Math.max(0.85, 0.94 - (depth - 1) * 0.04),
        rotate: tiltSeed % 2 ? 6 : -6,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
    >
      <CardFace {...chrome} />
    </motion.div>
  );
}

/**
 * The only draggable card. It is remounted on every throw (its key carries a
 * throw counter), which is the whole point: Framer Motion does not reliably
 * rebuild a drag gesture on a node that stays mounted while its role in the
 * stack changes, and that stale recogniser is what left the deck frozen after
 * one or two swipes. A card that never changes role cannot go stale.
 */
function FrontCard({
  canThrow,
  onThrow,
  onOpen,
  cardClassName,
  ...chrome
}: CardChrome & {
  canThrow: boolean;
  onThrow: (direction: -1 | 1) => void;
  onOpen: () => void;
  cardClassName?: string;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-18, 18]);
  const pressRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <motion.div
      className={cn(
        CARD_BASE,
        "cursor-grab touch-pan-y active:cursor-grabbing",
        cardClassName,
      )}
      style={{
        x,
        rotate,
        zIndex: 100,
        boxShadow:
          "0 14px 26px -8px rgb(12 35 36 / 0.42), 0 4px 8px -4px rgb(12 35 36 / 0.3)",
      }}
      initial={{ scale: 0.94 }}
      animate={{ scale: 1 }}
      // The direction has to arrive through AnimatePresence's `custom`, which
      // is read when the exit starts. An inline `exit` object would be frozen
      // at the values of the last render, i.e. before the drag happened.
      variants={{
        exit: (direction: -1 | 1) => ({
          x: direction * 460,
          opacity: 0,
          transition: { duration: 0.26, ease: [0.22, 0.8, 0.24, 1] },
        }),
      }}
      exit="exit"
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      drag={canThrow ? "x" : false}
      dragElastic={0.85}
      // Momentum kept the card coasting past the release point, so the throw
      // resolved late and the deck felt unresponsive.
      dragMomentum={false}
      onPointerDown={(event) => {
        pressRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const press = pressRef.current;
        pressRef.current = null;
        if (!press) return;
        const travelled =
          Math.abs(event.clientX - press.x) + Math.abs(event.clientY - press.y);
        if (travelled < TAP_SLOP) onOpen();
      }}
      onDragEnd={(_event, info) => {
        const thrown =
          canThrow &&
          (Math.abs(info.offset.x) > THROW_THRESHOLD ||
            Math.abs(info.velocity.x) > 450);
        if (thrown) {
          onThrow(info.offset.x < 0 ? -1 : 1);
          return;
        }
        // Spring back by hand rather than with dragSnapToOrigin, which would
        // race the exit animation on the throws that do land.
        animate(x, 0, { type: "spring", stiffness: 420, damping: 38 });
      }}
    >
      <CardFace {...chrome} />
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
  const imageSetKey = images.join("");

  // The last entry is the front card, matching the visual stacking order.
  const [order, setOrder] = useState<number[]>(() =>
    images.map((_, index) => index).reverse(),
  );
  // Bumped on every advance so the front card is guaranteed a fresh mount.
  const [generation, setGeneration] = useState(0);
  const [exitDirection, setExitDirection] = useState<-1 | 1>(-1);

  useEffect(() => {
    setOrder(images.map((_, index) => index).reverse());
    setGeneration(0);
  }, [imageSetKey, images]);

  const frontIndex = order[order.length - 1] ?? 0;

  /**
   * Throwing left advances to the next image, throwing right goes back to the
   * previous one, and the card that leaves rejoins the far end of the stack so
   * the deck never dead-ends.
   */
  const recycle = useCallback((direction: -1 | 1) => {
    setExitDirection(direction);
    setOrder((previous) => {
      if (previous.length < 2) return previous;
      const next = previous.slice();
      if (direction < 0) {
        next.unshift(next.pop()!);
      } else {
        next.push(next.shift()!);
      }
      return next;
    });
    setGeneration((current) => current + 1);
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

  /** Everything behind the front card, back-most first. */
  const behind = useMemo(() => {
    const depth = Math.min(stackSize, order.length);
    return order.slice(order.length - depth, order.length - 1);
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

  const counterFor = (index: number) =>
    showCounter || images.length > 1
      ? `${index + 1}/${images.length}`
      : undefined;

  return (
    <div
      data-stacked-deck
      data-deck-index={frontIndex}
      // shrink-0 keeps the shared size intact inside flex and grid parents,
      // which were otherwise squeezing individual decks a few pixels narrower.
      className={cn(
        "relative grid shrink-0 touch-pan-y place-items-center",
        className,
      )}
      role="region"
      aria-label={`${alt} gallery, drag to browse`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          recycle(1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          recycle(-1);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onImageClick?.(frontIndex);
        }
      }}
    >
      {behind.map((index, position) => (
        <BackCard
          key={`back-${images[index]}`}
          depth={behind.length - position}
          tiltSeed={index}
          cardClassName={cardClassName}
          source={images[index]}
          alt=""
          counter={counterFor(index)}
          label={labels?.[index]}
          fit={fit}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          sizes={sizes}
          quality={quality}
          priority={false}
          imageClassName={imageClassName}
        />
      ))}

      <AnimatePresence initial={false} custom={exitDirection}>
        <FrontCard
          key={`front-${frontIndex}-${generation}`}
          canThrow={images.length > 1}
          onThrow={recycle}
          onOpen={() => onImageClick?.(frontIndex)}
          cardClassName={cardClassName}
          source={images[frontIndex]}
          alt={alt}
          counter={counterFor(frontIndex)}
          label={labels?.[frontIndex]}
          fit={fit}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          sizes={sizes}
          quality={quality}
          priority={priority}
          imageClassName={imageClassName}
        />
      </AnimatePresence>

      {images.length > 1 && (
        <div className="deck-nav absolute bottom-2.5 left-1/2 z-[200] -translate-x-1/2">
          <button
            type="button"
            className="deck-nav__btn"
            aria-label="Previous image"
            onClick={() => recycle(1)}
          >
            <ChevronLeft className="size-3.5" strokeWidth={2.5} />
          </button>
          <span className="deck-nav__rule" aria-hidden />
          <button
            type="button"
            className="deck-nav__btn"
            aria-label="Next image"
            onClick={() => recycle(-1)}
          >
            <ChevronRight className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
