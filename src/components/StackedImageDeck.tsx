"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";

type DeckPhase = "idle" | "dragging" | "settling";

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
  gridBackground?: boolean;
  stackSize?: number;
  onImageClick?: (index: number) => void;
}

const SWIPE_THRESHOLD = 88;
const MAX_DRAG = 168;
const SETTLE_MS = 210;

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  gridBackground = false,
  stackSize = 3,
  onImageClick,
}: StackedImageDeckProps) {
  const [cursor, setCursor] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState<DeckPhase>("idle");
  const [previewDirection, setPreviewDirection] = useState<1 | -1>(1);
  const startXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const visibleCards = useMemo(() => {
    if (images.length === 0) return [];

    const visibleCount = Math.min(stackSize, images.length);
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = wrapIndex(
        cursor + previewDirection * offset,
        images.length,
      );
      return { index, url: images[index], offset };
    }).reverse();
  }, [cursor, images, previewDirection, stackSize]);

  const reset = () => {
    setCursor(0);
    setDragX(0);
    setPhase("idle");
    setPreviewDirection(1);
  };

  const completeSwipe = (direction: 1 | -1) => {
    setPreviewDirection(direction);
    setPhase("settling");
    setDragX(direction * 420);

    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = window.setTimeout(() => {
      setCursor((value) => wrapIndex(value + direction, images.length));
      setDragX(0);
      setPhase("idle");
    }, SETTLE_MS);
  };

  const snapBack = () => {
    setPhase("settling");
    setDragX(0);

    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
    }, SETTLE_MS);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (images.length <= 1 || phase === "settling") return;

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    didDragRef.current = false;
    setPhase("dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId || phase === "settling") {
      return;
    }

    const nextDragX = clamp(
      event.clientX - startXRef.current,
      -MAX_DRAG,
      MAX_DRAG,
    );
    if (Math.abs(nextDragX) > 4) {
      didDragRef.current = true;
      setPreviewDirection(nextDragX >= 0 ? 1 : -1);
    }
    setDragX(nextDragX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId || phase === "settling") {
      return;
    }

    pointerIdRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      completeSwipe(dragX > 0 ? 1 : -1);
      return;
    }

    if (!didDragRef.current) {
      onImageClick?.(cursor);
      setPhase("idle");
      return;
    }

    snapBack();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === event.pointerId) {
      pointerIdRef.current = null;
      snapBack();
    }
  };

  const progress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const activeDirection = dragX === 0 ? previewDirection : dragX > 0 ? 1 : -1;

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-visible",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {images.length === 0 && (
        <div style={{ gridRow: 1, gridColumn: 1 }} className="z-20">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="size-4" />
            Again
          </Button>
        </div>
      )}

      {visibleCards.map((card) => {
        const isFront = card.offset === 0;
        const depth = card.offset;
        const transform = isFront
          ? `translate3d(${dragX}px, 0, 0) rotate(${dragX * 0.045}deg) scale(${1 - progress * 0.018})`
          : `translate3d(${-activeDirection * depth * 10}px, ${depth * 10 - progress * depth * 4}px, 0) rotate(${activeDirection * depth * -3.4}deg) scale(${Math.min(0.98, 0.93 - depth * 0.045 + progress * 0.055)})`;
        const opacity = isFront
          ? Math.max(
              0.12,
              1 - Math.max(0, Math.abs(dragX) - SWIPE_THRESHOLD) / 250,
            )
          : Math.max(0.5, 0.9 - depth * 0.16 + progress * 0.08);

        return (
          <div
            key={`${card.index}-${card.offset}-${previewDirection}`}
            className={cn(
              "absolute inset-0 overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] will-change-transform",
              isFront
                ? "z-30 cursor-grab touch-pan-y active:cursor-grabbing"
                : "pointer-events-none",
              cardClassName,
            )}
            style={{
              opacity,
              transform,
              zIndex: isFront ? 30 : 30 - depth,
              transition:
                phase === "dragging"
                  ? "none"
                  : "transform 210ms cubic-bezier(0.22, 1, 0.36, 1), opacity 170ms ease-out",
              backgroundImage: gridBackground
                ? "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)"
                : undefined,
              backgroundSize: gridBackground ? "20px 20px" : undefined,
            }}
          >
            <ImageWithSkeleton
              src={card.url}
              alt={isFront ? alt : ""}
              width={imageWidth}
              height={imageHeight}
              sizes={sizes}
              quality={isFront ? quality : idleQuality}
              draggable={false}
              containerClassName="h-full w-full pointer-events-none"
              className={cn("h-full w-full select-none", imageClassName)}
              fetchPriority={priority && isFront ? "high" : "low"}
              loading={priority && isFront ? "eager" : "lazy"}
              priority={priority && isFront}
            />
          </div>
        );
      })}

      {showCounter && images.length > 1 && (
        <div className="pointer-events-none absolute right-2 bottom-2 z-40 rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
          {cursor + 1}/{images.length}
        </div>
      )}
    </div>
  );
}
