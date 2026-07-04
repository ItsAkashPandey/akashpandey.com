"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import ImageLightbox from "./ImageLightbox";
import StackedImageDeck from "./StackedImageDeck";

interface ActivitySwipeCardsProps {
  className?: string;
  images: string[];
  priority?: boolean;
}

export default function ActivitySwipeCards({
  className,
  images,
  priority = false,
}: ActivitySwipeCardsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  return (
    <>
      <StackedImageDeck
        images={images}
        alt="Activity photo"
        imageWidth={300}
        imageHeight={220}
        sizes="(max-width: 640px) min(280px, calc(100vw - 4rem)), 300px"
        quality={84}
        idleQuality={84}
        priority={priority}
        showCounter
        className={cn(
          "h-[200px] w-full max-w-[280px] rounded-xl sm:h-[220px] sm:max-w-[300px]",
          className,
        )}
        imageClassName="object-cover"
        onImageClick={openLightbox}
      />

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
}
