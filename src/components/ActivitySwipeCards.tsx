"use client";

import type { Photo } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import ImageLightbox from "./ImageLightbox";
import StackedImageDeck, { DECK_SIZE } from "./StackedImageDeck";

interface ActivitySwipeCardsProps {
  className?: string;
  photos: Photo[];
  /** What the photos show, usually the activity name. */
  alt: string;
  priority?: boolean;
}

export default function ActivitySwipeCards({
  className,
  photos,
  alt,
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
        photos={photos}
        alt={alt}
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
          photos={photos}
          alt={alt}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
