import type { Photo } from "@/lib/photo";
import fs from "node:fs";
import path from "node:path";

type ManifestEntry = {
  width: number;
  height: number;
  blur: string;
  variants: [number, string][];
};

let manifest: Record<string, ManifestEntry> | null = null;

function readManifest() {
  if (manifest) return manifest;
  try {
    const file = path.join(process.cwd(), ".generated", "image-manifest.json");
    manifest = JSON.parse(fs.readFileSync(file, "utf8")).images ?? {};
  } catch {
    // No manifest (the image script has not run): galleries fall back to
    // next/image, which still works, just without the pre-sized files.
    manifest = {};
  }
  return manifest!;
}

/**
 * Server-side: attaches the pre-sized variants to a photo path, and the blur
 * preview when `withBlur` is set.
 */
export function getPhoto(src: string, withBlur = true): Photo {
  const entry = readManifest()[src];
  const hash = entry?.variants[0]?.[1].match(/\/_img\/([a-f0-9]+)-\d+\.webp$/)?.[1];
  if (!entry || !hash) return { src };

  return {
    src,
    width: entry.width,
    height: entry.height,
    hash,
    widths: entry.variants.map(([width]) => width),
    ...(withBlur ? { blur: entry.blur } : {}),
  };
}

/**
 * Blur previews are only sent for the first few photos, the ones a stacked
 * deck shows before anyone swipes; later photos are preloaded before they
 * come to the front.
 */
export function getPhotos(sources: string[], blurFirst = 4): Photo[] {
  return sources.map((src, index) => getPhoto(src, index < blurFirst));
}
