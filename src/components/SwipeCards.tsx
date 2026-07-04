"use client";

import { cn } from "@/lib/utils";
import StackedImageDeck from "./StackedImageDeck";

interface SwipeCardsProps {
  className?: string;
  images?: string[];
}

type Card = {
  id: number;
  url: string;
};

export default function SwipeCards({ className, images }: SwipeCardsProps) {
  const deckImages = images?.length ? images : cardData.map((card) => card.url);

  return (
    <StackedImageDeck
      images={deckImages}
      alt="Photo of Akash"
      imageWidth={280}
      imageHeight={320}
      sizes="(max-width: 640px) 175px, 280px"
      quality={84}
      idleQuality={84}
      priority
      stackSize={4}
      className={cn("h-[233px] w-[175px] rounded-xl", className)}
      imageClassName="object-cover"
    />
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
