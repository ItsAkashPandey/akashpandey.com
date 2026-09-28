"use client";

import {
  isPhotoLoaded,
  markPhotoLoaded,
  photoAttributes,
  preloadPhoto,
} from "@/lib/browser-image-cache";
import type { Photo } from "@/lib/photo";
import { cn } from "@/lib/utils";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preload } from "react-dom";

interface StackedImageDeckProps {
  photos: Photo[];
  /** What the photos show; each card's alt adds "photo 2 of 9". */
  alt?: string;
  /** Per-photo alt text, when the images differ in kind (figures, posters). */
  alts?: string[];
  className?: string;
  cardClassName?: string;
  imageClassName?: string;
  /** Aspect of the card in the layout, used only for optimiser fallbacks. */
  imageWidth: number;
  imageHeight: number;
  sizes: string;
  /** Above the fold: load at once, at high priority, and preload the file. */
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
  photo: Photo;
  /** Render the real image, not just the blur preview. */
  showImage: boolean;
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

/**
 * The photo itself. A plain <img> with the pipeline's srcset rather than
 * next/image: the files are already sized, so there is nothing left to
 * optimise and no reason to route them through /_next/image.
 */
function DeckPhoto({
  photo,
  alt,
  fit,
  imageWidth,
  imageHeight,
  sizes,
  quality,
  priority,
  imageClassName,
}: Omit<CardChrome, "showImage" | "label" | "counter">) {
  const [loaded, setLoaded] = useState(() => isPhotoLoaded(photo));
  const attributes = photoAttributes(photo, {
    sizes,
    width: imageWidth,
    height: imageHeight,
    quality,
  });

  if (priority) {
    // Puts a <link rel="preload"> in the document head during rendering, so
    // the browser starts on the hero photo before it parses the gallery.
    preload(attributes.src, {
      as: "image",
      imageSrcSet: attributes.srcSet,
      imageSizes: attributes.sizes,
      fetchPriority: "high",
    });
  }

  const onLoad = () => {
    markPhotoLoaded(photo);
    setLoaded(true);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized files, see above
    <img
      ref={(node) => {
        // A server-rendered image can finish before hydration attaches onLoad.
        if (node?.complete && node.naturalWidth > 0 && !loaded) onLoad();
      }}
      src={attributes.src}
      srcSet={attributes.srcSet}
      sizes={attributes.sizes}
      width={photo.width}
      height={photo.height}
      alt={alt}
      // Deck cards sit under an animated transform, and Chromium never runs
      // the lazy-load check for an <img> under a transform, so `lazy` would
      // mean "never". The deck gates on viewport distance itself instead.
      loading="eager"
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onLoad={onLoad}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500 ease-out select-none",
        fit === "cover" ? "object-cover" : "object-contain",
        loaded ? "opacity-100" : "opacity-0",
        imageClassName,
      )}
    />
  );
}

function CardFace({ photo, showImage, label, counter, ...rest }: CardChrome) {
  return (
    <>
      {photo.blur ? (
        <span
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center blur-lg"
          style={{ backgroundImage: `url("${photo.blur}")` }}
        />
      ) : (
        <span aria-hidden className="bg-muted/70 absolute inset-0" />
      )}

      {showImage && <DeckPhoto photo={photo} {...rest} />}

      {counter && (
        <span className="deck-count pointer-events-none absolute top-2.5 right-2.5">
          {counter}
        </span>
      )}

      {label && (
        <>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 max-w-[calc(100%-5.5rem)] truncate rounded-sm bg-black/45 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {label}
          </span>
        </>
      )}
    </>
  );
}

const CARD_BASE =
  "absolute inset-0 origin-bottom overflow-hidden rounded-lg bg-muted [grid-area:1/1]";

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
        boxShadow: "0 8px 18px -10px hsl(var(--foreground) / 0.3)",
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
          "0 14px 26px -8px hsl(var(--foreground) / 0.42), 0 4px 8px -4px hsl(var(--foreground) / 0.3)",
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

/** Flips to true once the element comes within a screen of the viewport. */
function useNearViewport(initial: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(initial);

  useEffect(() => {
    if (near) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  return [ref, near] as const;
}

export default function StackedImageDeck({
  photos,
  alt = "Image",
  alts,
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
  const photoSetKey = photos.map((photo) => photo.src).join("");
  const [containerRef, nearViewport] = useNearViewport(priority);

  // The last entry is the front card, matching the visual stacking order.
  const [order, setOrder] = useState<number[]>(() =>
    photos.map((_, index) => index).reverse(),
  );
  // Bumped on every advance so the front card is guaranteed a fresh mount.
  const [generation, setGeneration] = useState(0);
  const [exitDirection, setExitDirection] = useState<-1 | 1>(-1);

  useEffect(() => {
    setOrder(photos.map((_, index) => index).reverse());
    setGeneration(0);
    // Only a different set of photos should reset the stack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoSetKey]);

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

  // Once the front photo is on its way, fetch its neighbours in both throw
  // directions at idle priority, so a swipe lands on an image already decoded.
  useEffect(() => {
    if (!nearViewport || photos.length < 2) return;
    const rendering = { sizes, width: imageWidth, height: imageHeight, quality };
    const neighbours = [
      photos[wrapDeckIndex(frontIndex + 1, photos.length)],
      photos[wrapDeckIndex(frontIndex - 1, photos.length)],
    ];
    const run = () => {
      for (const photo of neighbours) void preloadPhoto(photo, rendering);
    };
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(run, 200);
    return () => clearTimeout(timer);
  }, [photos, frontIndex, nearViewport, sizes, imageWidth, imageHeight, quality]);

  /** Everything behind the front card, back-most first. */
  const behind = useMemo(() => {
    const depth = Math.min(stackSize, order.length);
    return order.slice(order.length - depth, order.length - 1);
  }, [order, stackSize]);

  if (!photos.length) {
    return (
      <div className={cn("grid place-items-center", className)}>
        <div className="text-muted-foreground px-4 py-6 text-center text-xs">
          No images
        </div>
      </div>
    );
  }

  const altFor = (index: number) =>
    alts?.[index] ??
    (photos.length > 1
      ? `${alt}, photo ${index + 1} of ${photos.length}`
      : alt);

  const chrome = (index: number) => ({
    photo: photos[index],
    label: labels?.[index],
    fit,
    imageWidth,
    imageHeight,
    sizes,
    quality,
    imageClassName,
  });

  return (
    <div
      ref={containerRef}
      data-stacked-deck
      data-deck-index={frontIndex}
      // shrink-0 keeps the shared size intact inside flex and grid parents,
      // which were otherwise squeezing individual decks a few pixels narrower.
      className={cn(
        "relative grid shrink-0 touch-pan-y place-items-center",
        className,
      )}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${alt}: ${photos.length} ${
        photos.length === 1 ? "image" : "images"
      }. Drag or use the arrow keys to browse.`}
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
          key={`back-${photos[index].src}`}
          depth={behind.length - position}
          tiltSeed={index}
          cardClassName={cardClassName}
          {...chrome(index)}
          // The edges of the stack show the blur preview until that photo has
          // been downloaded for the front, so a deck costs one request, not
          // four. Decorative: no alt, no counter, no priority.
          showImage={nearViewport && isPhotoLoaded(photos[index])}
          alt=""
          priority={false}
        />
      ))}

      <AnimatePresence initial={false} custom={exitDirection}>
        <FrontCard
          key={`front-${frontIndex}-${generation}`}
          canThrow={photos.length > 1}
          onThrow={recycle}
          onOpen={() => onImageClick?.(frontIndex)}
          cardClassName={cardClassName}
          {...chrome(frontIndex)}
          showImage={nearViewport}
          alt={altFor(frontIndex)}
          counter={
            showCounter || photos.length > 1
              ? `${frontIndex + 1}/${photos.length}`
              : undefined
          }
          priority={priority && generation === 0}
        />
      </AnimatePresence>

      {photos.length > 1 && (
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
