"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import StackedImageDeck from "./StackedImageDeck";

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
  const deckImages = images?.length ? images : cardData.map((card) => card.url);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <StackedImageDeck
        images={deckImages}
        alt="Photo of Akash"
        imageWidth={baselineWidth}
        imageHeight={baselineHeight}
        sizes="(max-width: 640px) 175px, 280px"
        quality={84}
        idleQuality={84}
        priority
        stackSize={4}
        className={cn("h-[233px] w-[175px] rounded-xl", className)}
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
