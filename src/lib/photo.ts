/**
 * A photo as the galleries receive it. `hash` and `widths` point at the
 * pre-sized files the build-time pipeline writes (scripts/build-images.mjs);
 * when a photo is missing from its manifest they are absent and the gallery
 * falls back to next/image. Kept compact on purpose: the activities page
 * ships a few hundred of these.
 */
export type Photo = {
  src: string;
  width?: number;
  height?: number;
  /** A ~16px WebP data URL, shown blurred until the real image arrives. */
  blur?: string;
  /** Content hash of the source; files live at /_img/<hash>-<width>.webp. */
  hash?: string;
  widths?: number[];
};

export function photoVariants(photo: Photo) {
  if (!photo.hash || !photo.widths?.length) return [];
  return photo.widths.map((width) => ({
    width,
    src: `/_img/${photo.hash}-${width}.webp`,
  }));
}

export function photoSrcSet(photo: Photo) {
  return photoVariants(photo)
    .map((variant) => `${variant.src} ${variant.width}w`)
    .join(", ");
}

export function photoKey(photo: Photo) {
  return photo.hash ?? photo.src;
}
