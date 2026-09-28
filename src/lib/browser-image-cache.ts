import { photoKey, photoSrcSet, photoVariants, type Photo } from "@/lib/photo";
import { getImageProps } from "next/image";

/** Photos this page has finished downloading, keyed by `photoKey`. */
const loaded = new Set<string>();
const pending = new Map<string, Promise<void>>();

export function isPhotoLoaded(photo: Photo) {
  return loaded.has(photoKey(photo));
}

export function markPhotoLoaded(photo: Photo) {
  loaded.add(photoKey(photo));
}

type Rendering = {
  sizes: string;
  width: number;
  height: number;
  quality: number;
};

/**
 * The attributes a gallery <img> gets for a photo. Pre-sized files from the
 * build pipeline when the photo has them, otherwise next/image's optimiser.
 */
export function photoAttributes(photo: Photo, rendering: Rendering) {
  const variants = photoVariants(photo);
  if (variants.length) {
    return {
      src: variants[variants.length - 1].src,
      srcSet: photoSrcSet(photo),
      sizes: rendering.sizes,
    };
  }
  const { props } = getImageProps({
    src: photo.src,
    alt: "",
    width: rendering.width,
    height: rendering.height,
    sizes: rendering.sizes,
    quality: rendering.quality,
  });
  return {
    src: props.src,
    srcSet: props.srcSet,
    sizes: props.sizes ?? rendering.sizes,
  };
}

/**
 * Warms the browser cache with exactly the file the gallery will ask for: same
 * srcset, same sizes, so the browser picks the same candidate and the later
 * request is a cache hit. (Preloading the original path used to fetch every
 * photo twice.)
 */
export function preloadPhoto(
  photo: Photo,
  rendering: Rendering,
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const key = photoKey(photo);
  if (loaded.has(key)) return Promise.resolve();

  const existing = pending.get(key);
  if (existing) return existing;

  const attributes = photoAttributes(photo, rendering);
  const promise = new Promise<void>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    const done = () => {
      loaded.add(key);
      pending.delete(key);
      resolve();
    };
    image.onload = done;
    image.onerror = () => {
      pending.delete(key);
      resolve();
    };
    image.sizes = attributes.sizes;
    if (attributes.srcSet) image.srcset = attributes.srcSet;
    image.src = attributes.src;
  });

  pending.set(key, promise);
  return promise;
}

/**
 * Lightbox slides: the pre-sized files plus one optimiser size for large
 * screens, so the full-screen view never downloads a multi-megabyte original.
 */
export function lightboxSlide(photo: Photo, alt: string) {
  const large = optimizedImageUrl(photo.src, 1920);
  const variants = photoVariants(photo);
  if (!variants.length || !photo.width || !photo.height) {
    return { src: large, alt };
  }
  const ratio = photo.height / photo.width;
  const srcSet = variants.map((variant) => ({
    src: variant.src,
    width: variant.width,
    height: Math.round(variant.width * ratio),
  }));
  if (photo.width > variants[variants.length - 1].width) {
    const width = Math.min(1920, photo.width);
    srcSet.push({ src: large, width, height: Math.round(width * ratio) });
  }
  return {
    src: srcSet[srcSet.length - 1].src,
    alt,
    width: photo.width,
    height: photo.height,
    srcSet,
  };
}

/** The optimiser URL for an image at a given width (SVGs pass through). */
export function optimizedImageUrl(src: string, width = 1920, quality = 85) {
  if (!src.startsWith("/") || src.endsWith(".svg")) return src;
  return getImageProps({ src, width, height: width, quality, alt: "" }).props
    .src;
}
