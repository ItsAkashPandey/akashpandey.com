"use client";

import { lightboxSlide } from "@/lib/browser-image-cache";
import type { Photo } from "@/lib/photo";
import { useMemo } from "react";
import Lightbox from "yet-another-react-lightbox";

interface ImageLightboxProps {
  photos: Photo[];
  /** What the images show, for their alt text. */
  alt?: string;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  imageClassName?: string;
}

export default function ImageLightbox({
  photos,
  alt = "Image",
  currentIndex,
  onClose,
  onNavigate,
  imageClassName,
}: ImageLightboxProps) {
  const slides = useMemo(
    () =>
      photos.map((photo, index) =>
        lightboxSlide(
          photo,
          photos.length > 1 ? `${alt}, ${index + 1} of ${photos.length}` : alt,
        ),
      ),
    [alt, photos],
  );

  if (!photos.length) return null;

  return (
    <Lightbox
      open
      close={onClose}
      index={currentIndex}
      slides={slides}
      className="site-lightbox"
      carousel={{
        finite: false,
        imageFit: "contain",
        padding: "4%",
        preload: 2,
        spacing: 24,
        imageProps: {
          className: imageClassName,
          decoding: "async",
          draggable: false,
        },
      }}
      animation={{
        fade: 160,
        swipe: 260,
        navigation: 220,
        easing: {
          fade: "ease-out",
          swipe: "cubic-bezier(.22,.8,.24,1)",
          navigation: "cubic-bezier(.22,.8,.24,1)",
        },
      }}
      controller={{
        closeOnBackdropClick: true,
        closeOnPullDown: true,
        closeOnPullUp: false,
      }}
      on={{
        view: ({ index }) => {
          if (index !== currentIndex) onNavigate(index);
        },
      }}
      labels={{
        Lightbox: "Image gallery",
        "Photo gallery": "Image gallery",
      }}
    />
  );
}
