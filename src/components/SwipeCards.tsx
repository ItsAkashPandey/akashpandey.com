"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";

interface SwipeCardsProps {
  className?: string;
  images?: string[];
}

const SwipeCards = ({ className, images }: SwipeCardsProps) => {
  const sourceCards: Card[] = useMemo(
    () =>
      images?.length ? images.map((url, i) => ({ id: i + 1, url })) : cardData,
    [images],
  );
  const [cursor, setCursor] = useState(0);

  const cards = useMemo(() => {
    const visibleCount = Math.min(4, sourceCards.length);
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (cursor + offset) % sourceCards.length;
      return { ...sourceCards[index], offset };
    }).reverse();
  }, [cursor, sourceCards]);

  const resetCards = () => {
    setCursor(0);
  };

  const moveStack = (direction: 1 | -1) => {
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
          <Button onClick={resetCards} variant={"outline"}>
            <RefreshCw className="size-4" />
            Again
          </Button>
        </div>
      )}
      {cards.map((card, index) => {
        const depth = cards.length - 1 - index;
        return (
          <Card
            key={`${cursor}-${card.id}-${card.offset}`}
            depth={depth}
            imageCount={sourceCards.length}
            isFront={card.offset === 0}
            onSwipe={moveStack}
            {...card}
          />
        );
      })}
    </div>
  );
};

const Card = ({
  id,
  url,
  depth,
  imageCount,
  isFront,
  onSwipe,
}: {
  id: number;
  url: string;
  offset: number;
  depth: number;
  imageCount: number;
  isFront: boolean;
  onSwipe: (direction: 1 | -1) => void;
}) => {
  const x = useMotionValue(0);
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
    animate(x, direction > 0 ? 360 : -360, {
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
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const finalDx = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(finalDx) > 90 && imageCount > 1) {
      commitSwipe(finalDx > 0 ? 1 : -1);
    }
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    pointerStartX.current = event.clientX;
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (pointerStartX.current === null) return;
    const finalDx = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(finalDx) > 90 && imageCount > 1) {
      commitSwipe(finalDx > 0 ? 1 : -1);
    }
  };

  const handleDragEnd = (_event: any, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 90 && imageCount > 1) {
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

  return (
    <motion.div
      className="absolute h-[233px] w-[175px] origin-bottom overflow-hidden rounded-lg shadow-lg hover:cursor-grab active:cursor-grabbing"
      style={{
        gridRow: 1,
        gridColumn: 1,
        x,
        opacity,
        rotate,
        willChange: "transform",
        boxShadow: isFront
          ? "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)"
          : undefined,
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
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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

type Card = {
  id: number;
  url: string;
};

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
