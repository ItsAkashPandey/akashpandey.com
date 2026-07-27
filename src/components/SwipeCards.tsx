"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import StackedImageDeck, { DECK_SIZE } from "./StackedImageDeck";

interface SwipeCardsProps {
  className?: string;
  images?: string[];
  baselineWidth?: number;
  baselineHeight?: number;
}

type Card = {
  id: number;
  url: string;
};

export default function SwipeCards({
  className,
  images,
  baselineWidth = 3,
  baselineHeight = 4,
}: SwipeCardsProps) {
  const usesHomepageImages = !images?.length;
  const deckImages = images?.length ? images : cardData.map((card) => card.url);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <StackedImageDeck
        images={deckImages}
        alt="Photo of Akash"
        imageWidth={baselineWidth}
        imageHeight={baselineHeight}
        sizes="(max-width: 640px) 198px, 264px"
        quality={82}
        priority={usesHomepageImages}
        fit="cover"
        stackSize={4}
        className={cn(
          baselineWidth > baselineHeight
            ? DECK_SIZE.landscape
            : DECK_SIZE.portrait,
          "rounded-lg",
          className,
        )}
        onImageClick={setLightboxIndex}
      />
      {lightboxIndex !== null && (
        <ImageLightbox
          images={deckImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}

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
