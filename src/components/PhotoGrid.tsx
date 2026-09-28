"use client";

import {
  isPhotoLoaded,
  markPhotoLoaded,
  photoAttributes,
} from "@/lib/browser-image-cache";
import type { Photo } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

const SIZES = "(min-width: 1152px) 368px, (min-width: 640px) 33vw, 50vw";

function GridPhoto({
  photo,
  alt,
  index,
  onOpen,
}: {
  photo: Photo;
  alt: string;
  index: number;
  onOpen: (index: number) => void;
}) {
  const [loaded, setLoaded] = useState(() => isPhotoLoaded(photo));
  const attributes = photoAttributes(photo, {
    sizes: SIZES,
    width: 640,
    height: 480,
    quality: 80,
  });
  const onLoad = () => {
    markPhotoLoaded(photo);
    setLoaded(true);
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="group bg-muted relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:outline-none"
      style={{
        aspectRatio:
          photo.width && photo.height
            ? `${photo.width} / ${photo.height}`
            : "4 / 3",
      }}
    >
      {photo.blur && (
        <span
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center blur-lg"
          style={{ backgroundImage: `url("${photo.blur}")` }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized files from the image pipeline */}
      <img
        ref={(node) => {
          if (node?.complete && node.naturalWidth > 0 && !loaded) onLoad();
        }}
        src={attributes.src}
        srcSet={attributes.srcSet}
        sizes={attributes.sizes}
        width={photo.width}
        height={photo.height}
        alt={alt}
        // The first row is on screen straight away; the rest wait for scroll.
        loading={index < 3 ? "eager" : "lazy"}
        fetchPriority={index === 0 ? "high" : "auto"}
        decoding="async"
        onLoad={onLoad}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.02]",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

/** Every photo of an activity, as a masonry grid that opens the lightbox. */
export default function PhotoGrid({
  photos,
  alt,
}: {
  photos: Photo[];
  alt: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!photos.length) return null;

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3">
        {photos.map((photo, index) => (
          <GridPhoto
            key={photo.src}
            photo={photo}
            alt={`${alt}, photo ${index + 1} of ${photos.length}`}
            index={index}
            onOpen={setLightboxIndex}
          />
        ))}
      </div>
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
