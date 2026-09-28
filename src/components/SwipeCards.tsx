"use client";

import type { Photo } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import StackedImageDeck, { DECK_SIZE } from "./StackedImageDeck";

interface SwipeCardsProps {
  className?: string;
  photos: Photo[];
  /** What the photos show. */
  alt: string;
  baselineWidth?: number;
  baselineHeight?: number;
  priority?: boolean;
}

export default function SwipeCards({
  className,
  photos,
  alt,
  baselineWidth = 3,
  baselineHeight = 4,
  priority = false,
}: SwipeCardsProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const landscape = baselineWidth > baselineHeight;

  return (
    <>
      <StackedImageDeck
        photos={photos}
        alt={alt}
        imageWidth={landscape ? 264 : 198}
        imageHeight={landscape ? 198 : 264}
        sizes={landscape ? "264px" : "198px"}
        quality={82}
        priority={priority}
        fit="cover"
        stackSize={4}
        className={cn(
          landscape ? DECK_SIZE.landscape : DECK_SIZE.portrait,
          "rounded-lg",
          className,
        )}
        onImageClick={setLightboxIndex}
      />
      {lightboxIndex !== null && (
        <ImageLightbox
          photos={photos}
          alt={alt}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
