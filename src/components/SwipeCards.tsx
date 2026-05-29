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
import { useMemo, useRef, useState } from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";

interface SwipeCardsProps {
  className?: string;
  images?: string[];
}

type Card = {
  id: number;
  url: string;
};

type VisibleCard = Card & {
  offset: number;
};

const SWIPE_THRESHOLD = 90;

const SwipeCards = ({ className, images }: SwipeCardsProps) => {
  const sourceCards: Card[] = useMemo(
    () =>
      images?.length ? images.map((url, i) => ({ id: i + 1, url })) : cardData,
    [images],
  );
  const [cursor, setCursor] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);

  const cards: VisibleCard[] = useMemo(() => {
    const visibleCount = Math.min(4, sourceCards.length);
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (cursor + offset) % sourceCards.length;
      return { ...sourceCards[index], offset };
    }).reverse();
  }, [cursor, sourceCards]);

  const resetCards = () => {
    setCursor(0);
    setSwipeDirection(1);
  };

  const moveStack = (direction: 1 | -1) => {
    if (sourceCards.length <= 1) return;
    setSwipeDirection(direction);
    setCursor(
      (value) => (value + direction + sourceCards.length) % sourceCards.length,
    );
  };

  return (
    <div
      className={cn(
        "relative grid h-[233px] w-[175px] place-items-center rounded-xl",
        className,
      )}
    >
      {sourceCards.length === 0 && (
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
            <CardLayer
              key={
                isFront ? `front-${card.id}` : `back-${card.id}-${card.offset}`
              }
              depth={depth}
              imageCount={sourceCards.length}
              isFront={isFront}
              onSwipe={moveStack}
              swipeDirection={swipeDirection}
              {...card}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const CardLayer = ({
  id,
  url,
  depth,
  imageCount,
  isFront,
  onSwipe,
  swipeDirection,
}: {
  id: number;
  url: string;
  offset: number;
  depth: number;
  imageCount: number;
  isFront: boolean;
  onSwipe: (direction: 1 | -1) => void;
  swipeDirection: 1 | -1;
}) => {
  const x = useMotionValue(0);
  const didDrag = useRef(false);
  const baseRotate = isFront ? 0 : id % 2 ? 5 : -5;
  const rotateRaw = useTransform(x, [-170, 170], [-13, 13]);
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

  const scale = isFront ? 1 : Math.max(0.86, 0.95 - depth * 0.045);
  const y = depth * 4;

  return (
    <motion.div
      className="absolute h-[233px] w-[175px] origin-bottom overflow-hidden rounded-lg shadow-lg will-change-transform hover:cursor-grab active:cursor-grabbing"
      style={{
        gridRow: 1,
        gridColumn: 1,
        x: isFront ? x : 0,
        rotate: isFront ? rotate : `${baseRotate}deg`,
        zIndex: isFront ? 30 : 20 - depth,
      }}
      initial={
        isFront
          ? { x: -swipeDirection * 20, opacity: 0.9, scale: 0.98, y }
          : { opacity: 0.88, scale, y }
      }
      animate={{
        x: 0,
        y,
        scale,
        opacity: isFront ? 1 : Math.max(0.72, 0.94 - depth * 0.08),
      }}
      exit={{
        x: isFront ? swipeDirection * 390 : 0,
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
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        {isFront ? (
          <ImageWithSkeleton
            src={url}
            alt="Photo of Akash"
            width={175}
            height={233}
            sizes="175px"
            quality={75}
            draggable={false}
            containerClassName="h-full w-full pointer-events-none"
            className="h-full w-full object-cover select-none"
            fetchPriority="high"
            priority
          />
        ) : (
          <ImageWithSkeleton
            src={url}
            alt=""
            width={175}
            height={233}
            sizes="175px"
            quality={70}
            draggable={false}
            containerClassName="h-full w-full pointer-events-none"
            className="h-full w-full object-cover select-none"
            fetchPriority="low"
            loading="lazy"
          />
        )}
      </div>
    </motion.div>
  );
};

export default SwipeCards;

const cardData: Card[] = [
  {
    id: 1,
    url: "/img/akash-1.webp",
  },
  {
    id: 2,
    url: "/img/akash-2.webp",
  },
  {
    id: 3,
    url: "/img/akash-3.webp",
  },
  {
    id: 4,
    url: "/img/akash-4.webp",
  },
];
