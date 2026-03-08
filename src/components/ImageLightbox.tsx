"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import ImageWithSkeleton from "./ImageWithSkeleton";

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
    imageClassName?: string;
}

export default function ImageLightbox({
    images,
    currentIndex,
    onClose,
    onNavigate,
    imageClassName = "",
}: ImageLightboxProps) {
    const directionRef = useRef(0);

    // ── Drag state — on the outer wrapper, separate from transitions ──
    const dragX = useMotionValue(0);
    const dragOpacity = useTransform(dragX, [-300, 0, 300], [0.5, 1, 0.5]);
    const dragStartRef = useRef<number | null>(null);
    const didDragRef = useRef(false);

    const goNext = useCallback(() => {
        directionRef.current = 1;
        onNavigate((currentIndex + 1) % images.length);
    }, [currentIndex, images.length, onNavigate]);

    const goPrev = useCallback(() => {
        directionRef.current = -1;
        onNavigate((currentIndex - 1 + images.length) % images.length);
    }, [currentIndex, images.length, onNavigate]);

    const goTo = useCallback(
        (index: number) => {
            if (index === currentIndex) return;
            directionRef.current = index > currentIndex ? 1 : -1;
            onNavigate(index);
        },
        [currentIndex, onNavigate],
    );

    // Keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onClose, goNext, goPrev]);

    // ── Preload adjacent images ──
    useEffect(() => {
        for (let offset = -3; offset <= 3; offset++) {
            if (offset === 0) continue;
            let idx = currentIndex + offset;
            if (idx < 0) idx += images.length;
            if (idx >= images.length) idx -= images.length;
            const img = new Image();
            img.src = images[idx];
        }
    }, [currentIndex, images]);

    // ── Drag handlers ──
    const handlePointerDown = (e: React.PointerEvent) => {
        dragStartRef.current = e.clientX;
        didDragRef.current = false;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (dragStartRef.current === null) return;
        const dx = e.clientX - dragStartRef.current;
        if (Math.abs(dx) > 5) didDragRef.current = true;
        dragX.set(dx);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (dragStartRef.current === null) return;
        const finalDx = e.clientX - dragStartRef.current;
        dragStartRef.current = null;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

        if (Math.abs(finalDx) > 80 && images.length > 1) {
            finalDx > 0 ? goPrev() : goNext();
        }
        animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30 });
    };

    // ── Click-outside-to-close ──
    const clickStartPosRef = useRef<{ x: number; y: number } | null>(null);

    const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            clickStartPosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleBackdropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!clickStartPosRef.current) return;
        const dx = Math.abs(e.clientX - clickStartPosRef.current.x);
        const dy = Math.abs(e.clientY - clickStartPosRef.current.y);
        clickStartPosRef.current = null;
        if (dx < 10 && dy < 10) onClose();
    };

    const slideVariants = {
        enter: (d: number) => ({
            x: d > 0 ? 280 : -280,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (d: number) => ({
            x: d > 0 ? -280 : 280,
            opacity: 0,
        }),
    };

    const springTransition = {
        x: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 },
        opacity: { duration: 0.2, ease: "easeOut" as const },
    };

    const dir = directionRef.current;

    return createPortal(
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                style={{
                    background: "rgba(0, 0, 0, 0.45)",
                    backdropFilter: "blur(16px) saturate(1.2)",
                    WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                }}
                onPointerDown={handleBackdropPointerDown}
                onPointerUp={handleBackdropPointerUp}
            />

            {/* ── Popup card ── */}
            <motion.div
                className="relative z-10 w-full max-w-[820px] flex flex-col"
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div
                    className="relative overflow-hidden rounded-2xl"
                    style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(12px) saturate(1.5)",
                        WebkitBackdropFilter: "blur(12px) saturate(1.5)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow:
                            "0 24px 48px -12px rgba(0, 0, 0, 0.35), 0 0 0 0.5px rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-30 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200"
                        style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            backdropFilter: "blur(10px)",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.3)";
                        }}
                        aria-label="Close"
                    >
                        <X className="h-3.5 w-3.5 text-white/90" strokeWidth={2.5} />
                    </button>

                    {/* ── Image area — container with fixed background grid ── */}
                    <div
                        className="relative w-full h-[65vh] max-h-[560px] overflow-hidden rounded-t-xl"
                        style={{
                            backgroundColor: "white",
                            backgroundImage:
                                "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
                        }}
                    >
                        {/* ── Draggable wrapper ── */}
                        <motion.div
                            className="absolute inset-0 select-none touch-none cursor-grab active:cursor-grabbing"
                            style={{
                                x: dragX,
                                opacity: dragOpacity,
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.8}
                            onDragEnd={(e, info) => {
                                // Determine swipe direction
                                if (info.offset.x > 100 && images.length > 1) {
                                    goPrev();
                                } else if (info.offset.x < -100 && images.length > 1) {
                                    goNext();
                                }
                                // Always snap container back to center regardless of goNext/goPrev
                                animate(dragX, 0, { type: "spring", stiffness: 400, damping: 30 });
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {/* Inner — slide transitions only, no drag values */}
                            <AnimatePresence initial={false} custom={dir} mode="popLayout">
                                <motion.div
                                    key={currentIndex}
                                    custom={directionRef.current}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={springTransition}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <ImageWithSkeleton
                                        src={images[currentIndex]}
                                        alt={`Image ${currentIndex + 1} of ${images.length}`}
                                        width={1200}
                                        height={900}
                                        sizes="(max-width: 820px) 90vw, 820px"
                                        quality={85}
                                        containerClassName={`h-full w-full flex items-center justify-center pointer-events-none`}
                                        className={`max-h-[95%] sm:max-h-[92%] max-w-[95%] sm:max-w-[92%] w-auto h-auto object-contain ${imageClassName}`}
                                        priority
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* Preload adjacent */}
                            <div className="sr-only" aria-hidden="true">
                                {[-1, 1, 2, -2].map((offset) => {
                                    let idx = currentIndex + offset;
                                    if (idx < 0) idx += images.length;
                                    if (idx >= images.length) idx -= images.length;
                                    if (idx === currentIndex) return null;
                                    return (
                                        <img
                                            key={`preload-${idx}`}
                                            src={images[idx]}
                                            alt=""
                                            width={1}
                                            height={1}
                                            loading="eager"
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Nav arrows — stop propagation so they don't trigger drag */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
                                    style={{
                                        background: "rgba(0, 0, 0, 0.25)",
                                        backdropFilter: "blur(8px)",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.45)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.25)";
                                    }}
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="h-4 w-4 text-white/90" strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
                                    style={{
                                        background: "rgba(0, 0, 0, 0.25)",
                                        backdropFilter: "blur(8px)",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.45)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.25)";
                                    }}
                                    aria-label="Next"
                                >
                                    <ChevronRight className="h-4 w-4 text-white/90" strokeWidth={2.5} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* ── Bottom bar ── */}
                    {images.length > 1 && (
                        <div
                            className="flex items-center justify-center gap-3 py-3 px-4"
                            style={{
                                background: "rgba(0, 0, 0, 0.12)",
                                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                            }}
                        >
                            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                {images.length <= 20 ? (
                                    images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            className="rounded-full transition-all duration-300 ease-out"
                                            style={{
                                                width: i === currentIndex ? 20 : 6,
                                                height: 6,
                                                background:
                                                    i === currentIndex
                                                        ? "rgba(255, 255, 255, 0.9)"
                                                        : "rgba(255, 255, 255, 0.25)",
                                            }}
                                            aria-label={`Go to image ${i + 1}`}
                                        />
                                    ))
                                ) : (
                                    <div className="flex items-center gap-[3px]">
                                        {Array.from({ length: 7 }, (_, i) => {
                                            const half = 3;
                                            let idx = currentIndex - half + i;
                                            if (idx < 0) idx += images.length;
                                            if (idx >= images.length) idx -= images.length;
                                            const isCurrent = idx === currentIndex;
                                            const dist = Math.abs(i - half);
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => goTo(idx)}
                                                    className="rounded-full transition-all duration-300 ease-out"
                                                    style={{
                                                        width: isCurrent ? 18 : 5,
                                                        height: 5,
                                                        background: isCurrent
                                                            ? "rgba(255,255,255,0.9)"
                                                            : `rgba(255,255,255,${0.3 - dist * 0.05})`,
                                                        transform: `scale(${isCurrent ? 1 : 1 - dist * 0.06})`,
                                                    }}
                                                    aria-label={`Image ${idx + 1}`}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <span
                                className="text-sm font-medium shrink-0 tabular-nums"
                                style={{ color: "rgba(255, 255, 255, 0.5)" }}
                            >
                                {currentIndex + 1} / {images.length}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>,
        document.body,
    );
}
