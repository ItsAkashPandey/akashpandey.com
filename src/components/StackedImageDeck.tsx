"use client";

import { cn } from "@/lib/utils";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { MotionValue, PanInfo } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";

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

const SWIPE_THRESHOLD = 86;
const DRAG_LIMIT = 170;
const EXIT_DISTANCE = 430;

const SPRING = {
  type: "spring",
  stiffness: 460,
  damping: 42,
  mass: 0.72,
} as const;

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
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
  quality = 75,
  idleQuality = 70,
  showCounter = false,
  labels,
  gridBackground = false,
  stackSize = 3,
  onImageClick,
}: StackedImageDeckProps) {
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<"idle" | "dragging" | "settling">("idle");
  const [, setLoadedVersion] = useState(0);
  const loadedImagesRef = useRef(new Set<string>());
  const activeAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const x = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  const markLoaded = useCallback((src: string) => {
    if (loadedImagesRef.current.has(src)) return;
    loadedImagesRef.current.add(src);
    setLoadedVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!images.length) return;

    const preloadOffsets = [0, 1, -1, 2];
    const urls = Array.from(
      new Set(
        preloadOffsets.map(
          (offset) => images[wrapIndex(cursor + offset, images.length)],
        ),
      ),
    );
    let cancelled = false;

    urls.forEach((src) => {
      if (loadedImagesRef.current.has(src)) return;
      const image = new window.Image();
      image.decoding = "async";
      image.onload = () => {
        if (!cancelled) markLoaded(src);
      };
      image.onerror = () => {
        if (!cancelled) markLoaded(src);
      };
      image.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [cursor, images, markLoaded]);

  useEffect(() => {
    return () => {
      activeAnimationRef.current?.stop();
    };
  }, []);

  const nextCards = useMemo(() => {
    if (images.length <= 1) return [];

    const visibleCount = Math.min(
      Math.max(stackSize - 1, 1),
      images.length - 1,
    );

    return Array.from({ length: visibleCount }, (_, offset) => {
      const depth = offset + 1;
      const index = wrapIndex(cursor + depth, images.length);
      return { depth, index, src: images[index] };
    }).reverse();
  }, [cursor, images, stackSize]);

  const previousCard = useMemo(() => {
    if (images.length <= 1) return null;
    const index = wrapIndex(cursor - 1, images.length);
    return { depth: 1, index, src: images[index] };
  }, [cursor, images]);

  const frontRotate = useTransform(x, [-DRAG_LIMIT, 0, DRAG_LIMIT], [-7, 0, 7]);
  const frontScale = useTransform(
    x,
    [-DRAG_LIMIT, 0, DRAG_LIMIT],
    [0.965, 1, 0.965],
  );
  const frontOpacity = useTransform(
    x,
    [-EXIT_DISTANCE, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, EXIT_DISTANCE],
    [0, 0.95, 1, 0.95, 0],
  );

  const currentLabel = labels?.[cursor];
  const currentSrc = images[cursor];
  const knownLoaded = Boolean(
    currentSrc && loadedImagesRef.current.has(currentSrc),
  );
  const animationOptions = shouldReduceMotion
    ? ({ duration: 0.12 } as const)
    : SPRING;

  const settleToCenter = useCallback(() => {
    activeAnimationRef.current?.stop();
    activeAnimationRef.current = animate(x, 0, animationOptions);
    void activeAnimationRef.current.then(() => setPhase("idle"));
  }, [animationOptions, x]);

  const completeSwipe = useCallback(
    (direction: 1 | -1, velocity: number) => {
      activeAnimationRef.current?.stop();
      setPhase("settling");

      activeAnimationRef.current = animate(
        x,
        direction * EXIT_DISTANCE,
        shouldReduceMotion
          ? { duration: 0.12 }
          : {
              ...SPRING,
              velocity,
            },
      );

      void activeAnimationRef.current.then(() => {
        setCursor((value) => wrapIndex(value + direction, images.length));
        x.set(0);
        setPhase("idle");
      });
    },
    [images.length, shouldReduceMotion, x],
  );

  const handleDragStart = () => {
    if (phase === "settling") return;
    activeAnimationRef.current?.stop();
    setPhase("dragging");
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (phase === "settling") return;

    const finalX = x.get();
    const hasSwipeIntent =
      Math.abs(finalX) >= SWIPE_THRESHOLD || Math.abs(info.velocity.x) > 620;

    if (hasSwipeIntent && images.length > 1) {
      completeSwipe(finalX >= 0 ? 1 : -1, info.velocity.x);
      return;
    }

    settleToCenter();
  };

  const openCurrentImage = () => {
    if (phase !== "idle") return;
    onImageClick?.(cursor);
  };

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
        "relative grid place-items-center overflow-visible",
        className,
      )}
    >
      {nextCards.map((card) => (
        <NextLayerCard
          key={`next-${card.depth}-${card.index}`}
          cardClassName={cardClassName}
          depth={card.depth}
          dragX={x}
          gridBackground={gridBackground}
          idleQuality={idleQuality}
          imageClassName={imageClassName}
          imageHeight={imageHeight}
          imageWidth={imageWidth}
          isLoaded={loadedImagesRef.current.has(card.src)}
          markLoaded={markLoaded}
          sizes={sizes}
          src={card.src}
        />
      ))}

      {previousCard && (
        <PreviousLayerCard
          key={`previous-${previousCard.index}`}
          cardClassName={cardClassName}
          dragX={x}
          gridBackground={gridBackground}
          idleQuality={idleQuality}
          imageClassName={imageClassName}
          imageHeight={imageHeight}
          imageWidth={imageWidth}
          isLoaded={loadedImagesRef.current.has(previousCard.src)}
          markLoaded={markLoaded}
          sizes={sizes}
          src={previousCard.src}
        />
      )}

      <motion.div
        data-deck-card="front"
        data-deck-index={cursor}
        key={`front-${cursor}`}
        drag={images.length > 1 && phase !== "settling" ? "x" : false}
        dragConstraints={{ left: -DRAG_LIMIT, right: DRAG_LIMIT }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={openCurrentImage}
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] will-change-transform",
          "cursor-grab touch-pan-y active:cursor-grabbing",
          cardClassName,
        )}
        style={{
          x,
          rotate: frontRotate,
          scale: frontScale,
          opacity: frontOpacity,
          zIndex: 30,
          backgroundImage: gridBackground
            ? "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)"
            : undefined,
          backgroundSize: gridBackground ? "20px 20px" : undefined,
        }}
      >
        <DeckImage
          alt={alt}
          imageClassName={imageClassName}
          imageHeight={imageHeight}
          imageWidth={imageWidth}
          isLoaded={knownLoaded}
          loading={priority ? "eager" : "lazy"}
          markLoaded={markLoaded}
          priority={priority}
          quality={quality}
          sizes={sizes}
          src={currentSrc}
        />
      </motion.div>

      {(currentLabel || (showCounter && images.length > 1)) && (
        <div className="pointer-events-none absolute right-2 bottom-2 left-2 z-40 flex items-center justify-between gap-2">
          {currentLabel && (
            <span className="truncate rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
              {currentLabel}
            </span>
          )}
          {showCounter && images.length > 1 && (
            <span className="ml-auto rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
              {cursor + 1}/{images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function NextLayerCard({
  cardClassName,
  depth,
  dragX,
  gridBackground,
  idleQuality,
  imageClassName,
  imageHeight,
  imageWidth,
  isLoaded,
  markLoaded,
  sizes,
  src,
}: {
  cardClassName?: string;
  depth: number;
  dragX: MotionValue<number>;
  gridBackground: boolean;
  idleQuality: number;
  imageClassName?: string;
  imageHeight: number;
  imageWidth: number;
  isLoaded: boolean;
  markLoaded: (src: string) => void;
  sizes: string;
  src: string;
}) {
  const x = useTransform(
    dragX,
    [0, SWIPE_THRESHOLD],
    [-depth * 10, -Math.max(depth - 1, 0) * 8],
  );
  const y = useTransform(
    dragX,
    [0, SWIPE_THRESHOLD],
    [depth * 10, Math.max(depth - 1, 0) * 8],
  );
  const rotate = useTransform(
    dragX,
    [0, SWIPE_THRESHOLD],
    [-depth * 3.2, -Math.max(depth - 1, 0) * 2.4],
  );
  const scale = useTransform(
    dragX,
    [0, SWIPE_THRESHOLD],
    [0.92 - depth * 0.035, 0.96 - depth * 0.018],
  );
  const opacity = useTransform(
    dragX,
    [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    [0.12, 0.88 - depth * 0.13, 0.96 - depth * 0.07],
  );

  return (
    <motion.div
      data-deck-card="next"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] will-change-transform",
        cardClassName,
      )}
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        zIndex: 20 - depth,
        backgroundImage: gridBackground
          ? "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)"
          : undefined,
        backgroundSize: gridBackground ? "20px 20px" : undefined,
      }}
    >
      <DeckImage
        alt=""
        imageClassName={imageClassName}
        imageHeight={imageHeight}
        imageWidth={imageWidth}
        isLoaded={isLoaded}
        loading="lazy"
        markLoaded={markLoaded}
        priority={false}
        quality={idleQuality}
        sizes={sizes}
        src={src}
      />
    </motion.div>
  );
}

function PreviousLayerCard({
  cardClassName,
  dragX,
  gridBackground,
  idleQuality,
  imageClassName,
  imageHeight,
  imageWidth,
  isLoaded,
  markLoaded,
  sizes,
  src,
}: {
  cardClassName?: string;
  dragX: MotionValue<number>;
  gridBackground: boolean;
  idleQuality: number;
  imageClassName?: string;
  imageHeight: number;
  imageWidth: number;
  isLoaded: boolean;
  markLoaded: (src: string) => void;
  sizes: string;
  src: string;
}) {
  const x = useTransform(dragX, [-SWIPE_THRESHOLD, 0], [0, 10]);
  const y = useTransform(dragX, [-SWIPE_THRESHOLD, 0], [4, 10]);
  const rotate = useTransform(dragX, [-SWIPE_THRESHOLD, 0], [1.2, 3.2]);
  const scale = useTransform(dragX, [-SWIPE_THRESHOLD, 0], [0.97, 0.92]);
  const opacity = useTransform(
    dragX,
    [-SWIPE_THRESHOLD, -12, 0, SWIPE_THRESHOLD],
    [0.94, 0.45, 0.02, 0.02],
  );

  return (
    <motion.div
      data-deck-card="previous"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] will-change-transform",
        cardClassName,
      )}
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        zIndex: 26,
        backgroundImage: gridBackground
          ? "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)"
          : undefined,
        backgroundSize: gridBackground ? "20px 20px" : undefined,
      }}
    >
      <DeckImage
        alt=""
        imageClassName={imageClassName}
        imageHeight={imageHeight}
        imageWidth={imageWidth}
        isLoaded={isLoaded}
        loading="lazy"
        markLoaded={markLoaded}
        priority={false}
        quality={idleQuality}
        sizes={sizes}
        src={src}
      />
    </motion.div>
  );
}

function DeckImage({
  alt,
  imageClassName,
  imageHeight,
  imageWidth,
  isLoaded,
  loading,
  markLoaded,
  priority,
  quality,
  sizes,
  src,
}: {
  alt: string;
  imageClassName?: string;
  imageHeight: number;
  imageWidth: number;
  isLoaded: boolean;
  loading: "eager" | "lazy";
  markLoaded: (src: string) => void;
  priority: boolean;
  quality: number;
  sizes: string;
  src: string;
}) {
  return (
    <ImageWithSkeleton
      src={src}
      alt={alt}
      width={imageWidth}
      height={imageHeight}
      sizes={sizes}
      quality={quality}
      draggable={false}
      containerClassName="pointer-events-none h-full w-full"
      className={cn("h-full w-full select-none", imageClassName)}
      fetchPriority={priority ? "high" : "low"}
      initialLoaded={isLoaded}
      loading={loading}
      priority={priority}
      onLoad={() => markLoaded(src)}
      onError={() => markLoaded(src)}
    />
  );
}
