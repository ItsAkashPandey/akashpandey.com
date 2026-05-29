"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import ImageLightbox from "./ImageLightbox";
import ImageWithSkeleton from "./ImageWithSkeleton";

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
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const cards: CardItem[] = useMemo(() => {
    if (images.length === 0) return [];

    const visibleCount = Math.min(STACK_SIZE, images.length);
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (cursor + offset) % images.length;
      return { id: index, url: images[index], offset };
    }).reverse();
  }, [cursor, images]);

  const resetCards = () => {
    setCursor(0);
    setSwipeDirection(1);
  };

  const moveStack = useCallback(
    (direction: 1 | -1) => {
      if (images.length <= 1) return;
      setSwipeDirection(direction);
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
            <Button onClick={resetCards} variant="outline">
              <RefreshCw className="size-4" />
              Again
            </Button>
          </div>
        )}

        <AnimatePresence initial={false} custom={swipeDirection}>
          {cards.map((card, index) => {
            const depth = cards.length - 1 - index;
            const isFront = card.offset === 0;

            return (
              <SwipeCard
                key={
                  isFront
                    ? `front-${card.id}`
                    : `back-${card.id}-${card.offset}`
                }
                depth={depth}
                imageCount={images.length}
                isFront={isFront}
                onSwipe={moveStack}
                onImageClick={openLightbox}
                priority={priority && isFront}
                swipeDirection={swipeDirection}
                {...card}
              />
            );
          })}
        </AnimatePresence>
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
  swipeDirection,
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
  swipeDirection: 1 | -1;
}) => {
  const x = useMotionValue(0);
  const didDrag = useRef(false);
  const baseRotate = isFront ? 0 : id % 2 ? 5 : -5;
  const rotateRaw = useTransform(x, [-180, 180], [-14, 14]);
  const rotate = useTransform(() => `${rotateRaw.get() + baseRotate}deg`);

  const handleDragStart = () => {
    didDrag.current = false;
  };

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (Math.abs(info.offset.x) > 4) {
      didDrag.current = true;
    }
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const projectedX = info.offset.x + info.velocity.x * 0.16;

    if (Math.abs(projectedX) > SWIPE_THRESHOLD && imageCount > 1) {
      onSwipe(projectedX > 0 ? 1 : -1);
    }
  };

  const handleClick = () => {
    if (!didDrag.current && isFront) {
      onImageClick(url);
    }
  };

  const scale = isFront ? 1 : Math.max(0.86, 0.95 - depth * 0.045);
  const y = depth * 4;
  const imgClass = "h-full w-full select-none object-contain";

  return (
    <motion.div
      className="absolute h-[200px] w-full max-w-[280px] origin-bottom overflow-hidden rounded-lg border border-gray-100 bg-white p-2 shadow-lg will-change-transform hover:cursor-grab active:cursor-grabbing sm:h-[220px] sm:max-w-[300px]"
      style={{
        gridRow: 1,
        gridColumn: 1,
        x: isFront ? x : 0,
        rotate: isFront ? rotate : `${baseRotate}deg`,
        zIndex: isFront ? 30 : 20 - depth,
        backgroundColor: "#ffffff",
        backgroundImage:
          "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
      initial={
        isFront
          ? { x: -swipeDirection * 24, opacity: 0.88, scale: 0.98, y }
          : { opacity: 0.88, scale, y }
      }
      animate={{
        x: 0,
        y,
        scale,
        opacity: isFront ? 1 : Math.max(0.72, 0.94 - depth * 0.08),
      }}
      exit={{
        x: isFront ? swipeDirection * 460 : 0,
        y,
        scale: isFront ? 0.96 : scale,
        opacity: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 720,
        damping: 48,
        mass: 0.55,
      }}
      drag={isFront && imageCount > 1 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.72}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
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
