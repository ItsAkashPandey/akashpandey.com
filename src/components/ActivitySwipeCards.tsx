"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import ImageLightbox from "./ImageLightbox";
import StackedImageDeck, { DECK_SIZE } from "./StackedImageDeck";

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
        imageWidth={264}
        imageHeight={198}
        sizes="264px"
        quality={82}
        priority={priority}
        showCounter
        className={cn(DECK_SIZE.landscape, "rounded-lg", className)}
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
