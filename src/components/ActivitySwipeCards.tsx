"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";
import ImageLightbox from "./ImageLightbox";

interface ActivitySwipeCardsProps {
  className?: string;
  images: string[];
  priority?: boolean;
}

type CardItem = {
  id: number;
  url: string;
  offset: number;
};

const STACK_SIZE = 3;
const SWIPE_THRESHOLD = 90;

const ActivitySwipeCards = ({
  className,
  images,
  priority = false,
}: ActivitySwipeCardsProps) => {
  const [cursor, setCursor] = useState(0);

  // Keep only a tiny cyclic thumbnail window mounted. Large activity folders can
  // contain 50 photos, so rendering the whole stack makes the page stall.
  const cards: CardItem[] = useMemo(() => {
    if (images.length === 0) return [];

    const visibleCount = Math.min(STACK_SIZE, images.length);
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (cursor + offset) % images.length;
      return { id: index, url: images[index], offset };
    }).reverse();
  }, [cursor, images]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const resetCards = () => {
    setCursor(0);
  };

  const moveStack = useCallback(
    (direction: 1 | -1) => {
      setCursor((value) => (value + direction + images.length) % images.length);
    },
    [images.length],
  );

  const openLightbox = useCallback(
    (url: string) => {
      const idx = images.indexOf(url);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    },
    [images],
  );

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  return (
    <>
      <div
        className={cn(
          "relative grid h-[200px] w-full max-w-[280px] place-items-center rounded-xl sm:h-[220px] sm:max-w-[300px]",
          className,
        )}
      >
        {images.length === 0 && (
          <div style={{ gridRow: 1, gridColumn: 1 }} className="z-20">
            <Button onClick={resetCards} variant={"outline"}>
              <RefreshCw className="size-4" />
              Again
            </Button>
          </div>
        )}
        {cards.map((card, index) => {
          const depth = cards.length - 1 - index;
          return (
            <SwipeCard
              key={`${cursor}-${card.id}-${card.offset}`}
              depth={depth}
              imageCount={images.length}
              isFront={card.offset === 0}
              onSwipe={moveStack}
              onImageClick={openLightbox}
              priority={priority && card.offset === 0}
              {...card}
            />
          );
        })}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
};

const SwipeCard = ({
  id,
  url,
  depth,
  isFront,
  imageCount,
  onSwipe,
  onImageClick,
  priority,
}: {
  id: number;
  url: string;
  offset: number;
  depth: number;
  imageCount: number;
  isFront: boolean;
  onSwipe: (direction: 1 | -1) => void;
  onImageClick: (url: string) => void;
  priority: boolean;
}) => {
  const x = useMotionValue(0);
  const didDrag = useRef(false);
  const pointerStartX = useRef<number | null>(null);
  const swipeInFlight = useRef(false);

  const rotateRaw = useTransform(x, [-180, 180], [-16, 16]);
  const opacity = useTransform(x, [-180, 0, 180], [0.35, 1, 0.35]);

  const rotate = useTransform(() => {
    const offset = isFront ? 0 : id % 2 ? 5 : -5;
    return `${rotateRaw.get() + offset}deg`;
  });

  const commitSwipe = (direction: 1 | -1) => {
    if (swipeInFlight.current) return;
    swipeInFlight.current = true;
    animate(x, direction > 0 ? 420 : -420, {
      type: "spring",
      stiffness: 520,
      damping: 42,
      mass: 0.6,
    }).then(() => {
      x.set(0);
      swipeInFlight.current = false;
      onSwipe(direction);
    });
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    pointerStartX.current = event.clientX;
    didDrag.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    if (Math.abs(event.clientX - pointerStartX.current) > 5) {
      didDrag.current = true;
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const finalDx = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(finalDx) > SWIPE_THRESHOLD && imageCount > 1) {
      commitSwipe(finalDx > 0 ? 1 : -1);
    }
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    pointerStartX.current = event.clientX;
    didDrag.current = false;
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (pointerStartX.current === null) return;
    if (Math.abs(event.clientX - pointerStartX.current) > 5) {
      didDrag.current = true;
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (pointerStartX.current === null) return;
    const finalDx = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(finalDx) > SWIPE_THRESHOLD && imageCount > 1) {
      commitSwipe(finalDx > 0 ? 1 : -1);
    }
  };

  const handleDragEnd = (_event: any, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD && imageCount > 1) {
      commitSwipe(info.offset.x > 0 ? 1 : -1);
      return;
    }

    animate(x, 0, {
      type: "spring",
      stiffness: 520,
      damping: 42,
      mass: 0.65,
    });
  };

  const handleClick = () => {
    if (!didDrag.current && isFront) {
      onImageClick(url);
    }
  };

  const imgClass = "h-full w-full select-none object-contain";

  return (
    <motion.div
      className="absolute h-[200px] w-full max-w-[280px] origin-bottom overflow-hidden rounded-lg border border-gray-100 bg-white p-2 shadow-lg hover:cursor-grab active:cursor-grabbing sm:h-[220px] sm:max-w-[300px]"
      style={{
        gridRow: 1,
        gridColumn: 1,
        x,
        opacity,
        rotate,
        willChange: "transform",
        boxShadow: isFront
          ? "0 14px 24px -14px rgb(0 0 0 / 0.38), 0 8px 18px -18px rgb(0 0 0 / 0.35)"
          : undefined,
        backgroundColor: "#ffffff",
        backgroundImage:
          "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
      animate={{
        y: depth * 4,
        scale: isFront ? 1 : Math.max(0.86, 0.95 - depth * 0.045),
      }}
      transition={{ type: "spring", stiffness: 520, damping: 44, mass: 0.7 }}
      drag={isFront && imageCount > 1 ? "x" : false}
      dragConstraints={{
        left: -170,
        right: 170,
        top: 0,
        bottom: 0,
      }}
      dragElastic={0.55}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white">
        {isFront ? (
          <ImageWithSkeleton
            src={url}
            alt="Activity photo"
            width={300}
            height={220}
            sizes="(max-width: 640px) min(280px, calc(100vw - 4rem)), 300px"
            quality={75}
            draggable={false}
            containerClassName="h-full w-full pointer-events-none"
            className={imgClass}
            fetchPriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />
        ) : (
          <ImageWithSkeleton
            src={url}
            alt=""
            width={300}
            height={220}
            sizes="(max-width: 640px) min(280px, calc(100vw - 4rem)), 300px"
            quality={70}
            draggable={false}
            containerClassName="h-full w-full pointer-events-none"
            className={imgClass}
            fetchPriority="low"
            loading="lazy"
          />
        )}
      </div>
    </motion.div>
  );
};

export default ActivitySwipeCards;
