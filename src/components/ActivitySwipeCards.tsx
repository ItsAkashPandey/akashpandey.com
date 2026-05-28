"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
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

const ActivitySwipeCards = ({ className, images, priority = false }: ActivitySwipeCardsProps) => {
    const [cursor, setCursor] = useState(0);

    // Keep only a tiny thumbnail window mounted. Large activity folders can
    // contain 50 photos, so rendering the whole stack makes the page stall.
    const cards: CardItem[] = images
        .slice(cursor, cursor + STACK_SIZE)
        .map((url, offset) => ({ id: cursor + offset, url, offset }))
        .reverse();

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const resetCards = () => {
        setCursor(0);
    };

    const openLightbox = useCallback((url: string) => {
        const idx = images.indexOf(url);
        setLightboxIndex(idx >= 0 ? idx : 0);
        setLightboxOpen(true);
    }, [images]);

    const closeLightbox = useCallback(() => setLightboxOpen(false), []);

    return (
        <>
            <div
                className={cn(
                    "relative grid h-[200px] w-full max-w-[280px] place-items-center rounded-xl sm:h-[220px] sm:max-w-[300px]",
                    className,
                )}
            >
                {cursor >= images.length && (
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
                            key={card.id}
                            depth={depth}
                            isFront={card.offset === 0}
                            onDismiss={() => setCursor((value) => Math.min(value + 1, images.length))}
                            onImageClick={openLightbox}
                            priority={priority && card.offset === 0}
                            {...card}
                        />
                    );
                })}
            </div>

            {/* Lightbox */}
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
    onDismiss,
    onImageClick,
    priority,
}: {
    id: number;
    url: string;
    offset: number;
    depth: number;
    isFront: boolean;
    onDismiss: () => void;
    onImageClick: (url: string) => void;
    priority: boolean;
}) => {
    const x = useMotionValue(0);
    const didDrag = useRef(false);

    const rotateRaw = useTransform(x, [-150, 150], [-18, 18]);
    const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

    const rotate = useTransform(() => {
        const offset = isFront ? 0 : id % 2 ? 6 : -6;
        return `${rotateRaw.get() + offset}deg`;
    });

    const handleDragStart = () => {
        didDrag.current = false;
    };

    const handleDrag = () => {
        didDrag.current = true;
    };

    const handleDragEnd = (_event: any, info: { offset: { x: number } }) => {
        if (Math.abs(info.offset.x) > 100) {
            // Swiped far enough in any direction → dismiss card
            onDismiss();
        } else {
            // Snap back
            animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
        }
    };

    const handleClick = () => {
        // Only open lightbox on click (not after drag)
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
                boxShadow: isFront
                    ? "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)"
                    : undefined,
                backgroundColor: "#ffffff",
                backgroundImage:
                    "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
                backgroundSize: "20px 20px",
            }}
            animate={{
                scale: isFront ? 1 : Math.max(0.85, 0.94 - depth * 0.04),
            }}
            drag={isFront ? "x" : false}
            dragConstraints={{
                left: -150,
                right: 150,
                top: 0,
                bottom: 0,
            }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
        >
            <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
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
