// The intro loader paints this photo across the whole viewport, so a 1200px
// source is stretched roughly 2x on a desktop display. Naive sharpening at that
// scale just draws halos around every edge, which reads as worse than soft. So:
// resample with Lanczos, recover local contrast with CLAHE (which lifts
// perceived detail without touching edge transitions), and finish with a
// small-radius unsharp only. Run: node scripts/sharpen-intro-photo.mjs
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "public/img/akash-4.webp";
const ARCHIVE = "public/img/_originals/akash-4.webp";

const exists = async (file) =>
  access(file).then(
    () => true,
    () => false,
  );

// Always process from the untouched original. Re-running against an already
// processed file would stack sharpening passes on top of each other.
const input = (await exists(ARCHIVE)) ? ARCHIVE : SOURCE;
const source = await readFile(input);
const original = await sharp(source).metadata();

if (input === SOURCE) {
  await mkdir(path.dirname(ARCHIVE), { recursive: true });
  await writeFile(ARCHIVE, source);
}

const output = await sharp(source)
  .resize({
    width: original.width * 2,
    height: original.height * 2,
    kernel: "lanczos3",
  })
  // Contrast-limited local histogram equalisation. This is what actually makes
  // the frame read as detailed: it separates tones inside the foliage and the
  // lattice rather than outlining them. maxSlope is held low so it cannot
  // posterise the flat sky.
  .clahe({ width: 96, height: 96, maxSlope: 2 })
  // A tight radius only. The wide pass this replaced was the halo source.
  .sharpen({ sigma: 0.7, m1: 0.5, m2: 1.6, x1: 2, y2: 8 })
  // Nudged toward the site's warm paper hue family rather than left on the
  // photo's cool overcast cast, and deliberately not brightened.
  .modulate({ saturation: 1.06, brightness: 0.97, hue: 4 })
  .webp({ quality: 90, effort: 6, smartSubsample: true })
  .toBuffer();

await writeFile(SOURCE, output);
const result = await sharp(output).metadata();
console.log(
  `${original.width}x${original.height} -> ${result.width}x${result.height}`,
);
