import type { Activity } from "@/lib/schemas";
import fs from "node:fs";
import path from "node:path";

const IMAGE_FILE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const cache = new Map<string, string[]>();

/**
 * Lists an activity's photos straight from its folder under public/, so adding
 * a photo is just dropping a file in. This runs at build time: every page
 * that shows activity photos is statically generated, and public/ is not
 * shipped inside the serverless functions.
 */
export function getActivityImages(activity: Pick<Activity, "imageFolder">) {
  const folder = activity.imageFolder;
  if (!folder) return [];

  const cached = cache.get(folder);
  if (cached) return cached;

  const directory = path.join(process.cwd(), "public", folder);
  let images: string[] = [];
  try {
    images = fs
      .readdirSync(directory)
      .filter((file) => IMAGE_FILE.test(file))
      .sort(compareImageNames)
      .map((file) => `/${folder}/${file}`);
  } catch {
    console.warn(`[activities] Image folder not found: public/${folder}`);
  }

  cache.set(folder, images);
  return images;
}

/** "1.webp" leads, then 2, 3 ... numerically, then 0, then unnumbered names. */
export function compareImageNames(a: string, b: string) {
  const ak = imageSortKey(a);
  const bk = imageSortKey(b);

  if (ak.priority !== bk.priority) return ak.priority - bk.priority;
  if (ak.number !== bk.number) return ak.number - bk.number;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function imageSortKey(fileName: string) {
  const stem = path.parse(fileName).name.toLowerCase();
  const match = stem.match(/^0*(\d+)(?:\D|$)/);
  const number = match ? Number(match[1]) : Number.POSITIVE_INFINITY;

  return {
    number,
    priority:
      number === 1
        ? 0
        : Number.isFinite(number) && number > 1
          ? 1
          : number === 0
            ? 2
            : 3,
  };
}
