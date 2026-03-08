"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ImageWithSkeleton from "./ImageWithSkeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageSliderProps {
    images: string[];
    alt?: string;
    className?: string;
}

export default function ImageSlider({ images, alt = "Project image", className = "" }: ImageSliderProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi, setSelectedIndex]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
    }, [emblaApi, onSelect]);

    // If there's only one image, just show it without slider controls
    if (images.length <= 1) {
        return (
            <div className={`relative overflow-hidden ${className}`}>
                <ImageWithSkeleton
                    src={images[0]}
                    alt={alt}
                    width={500}
                    height={300}
                    sizes="(max-width: 640px) calc(100vw - 4rem), 344px"
                    quality={75}
                    containerClassName="h-full w-full"
                    className="h-full w-full object-cover object-center"
                />
            </div>
        );
    }

    return (
        <div className={`relative group overflow-hidden ${className}`}>
            <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex touch-pan-y h-full">
                    {images.map((img, index) => (
                        <div className="flex-[0_0_100%] min-w-0 relative h-full" key={index}>
                            <ImageWithSkeleton
                                src={img}
                                alt={`${alt} - Image ${index + 1}`}
                                width={500}
                                height={300}
                                sizes="(max-width: 640px) calc(100vw - 4rem), 344px"
                                quality={75}
                                containerClassName="h-full w-full"
                                className="h-full w-full object-cover object-center"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={(e) => {
                    e.preventDefault(); // Prevent link clicks when dragging/clicking buttons
                    scrollPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-background opacity-0 group-hover:opacity-100 disabled:opacity-0 z-10"
                aria-label="Previous image"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    scrollNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-background opacity-0 group-hover:opacity-100 disabled:opacity-0 z-10"
                aria-label="Next image"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.preventDefault();
                            emblaApi?.scrollTo(index);
                        }}
                        className={`h-1.5 rounded-full transition-all ${index === selectedIndex
                            ? "w-4 bg-primary"
                            : "w-1.5 bg-primary/40 hover:bg-primary/60"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
