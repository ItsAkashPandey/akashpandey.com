"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";
import ImageLightbox from "./ImageLightbox";

interface ActivitySwipeCardsProps {
    className?: string;
    images: string[];
}

type CardItem = {
    id: number;
    url: string;
};

const ActivitySwipeCards = ({ className, images }: ActivitySwipeCardsProps) => {
    // We reverse the array here because elements map into the DOM in order,
    // meaning the LAST element in the array renders on TOP of the stack.
    // By reversing, the first image in the list is placed at the end of the
    // DOM stack, naturally appearing as the top card.
    const initialCards: CardItem[] = [...images].reverse().map((url, i) => ({ id: i + 1, url }));
    const [cards, setCards] = useState<CardItem[]>(initialCards);

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const resetCards = () => {
        setCards(initialCards);
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
                    "relative grid h-[220px] w-[300px] place-items-center rounded-xl",
                    className,
                )}
            >
                {cards.length === 0 && (
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
                            cards={cards}
                            setCards={setCards}
                            depth={depth}
                            onImageClick={openLightbox}
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
    setCards,
    cards,
    depth,
    onImageClick,
}: {
    id: number;
    url: string;
    setCards: Dispatch<SetStateAction<CardItem[]>>;
    cards: CardItem[];
    depth: number;
    onImageClick: (url: string) => void;
}) => {
    const x = useMotionValue(0);
    const didDrag = useRef(false);

    const rotateRaw = useTransform(x, [-150, 150], [-18, 18]);
    const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

    const isFront = id === cards[cards.length - 1]?.id;

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
            setCards((pv) => pv.filter((v) => v.id !== id));
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
            className="absolute h-[220px] w-[300px] origin-bottom overflow-hidden rounded-lg bg-white p-2 border border-gray-100 hover:cursor-grab active:cursor-grabbing shadow-lg"
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
                        sizes="300px"
                        quality={75}
                        draggable={false}
                        containerClassName="h-full w-full pointer-events-none"
                        className={imgClass}
                        fetchPriority="high"
                        priority
                    />
                ) : (
                    <ImageWithSkeleton
                        src={url}
                        alt=""
                        width={300}
                        height={220}
                        sizes="300px"
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
