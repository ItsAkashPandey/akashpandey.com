// Pre-sizes every photo the site shows and writes a tiny blurred preview of
// each, so galleries load straight off the CDN instead of waiting for the
// image optimiser to resize a 1 MB camera file on the first visit.
//
// Output (both git-ignored):
//   public/_img/<hash>-<width>.webp   content-hashed, cached forever
//   .generated/image-manifest.json   sizes, variants and blur per photo
//
// Runs before `npm run build` and `npm run dev`. Results are cached in
// .next/cache/site-images, which Vercel keeps between builds, so only new or
// changed photos are processed. Run by hand: npm run images
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");
const outputDir = path.join(publicDir, "_img");
const cacheDir = path.join(root, ".next", "cache", "site-images");
const manifestPath = path.join(root, ".generated", "image-manifest.json");

const WIDTHS = [320, 640, 1280];
const QUALITY = 75;
// Bump when the output format changes, to invalidate the cache.
const PIPELINE = "v1";
const RASTER = /\.(jpe?g|png|webp|avif)$/i;

const readJson = async (file) =>
  JSON.parse(await fs.readFile(path.join(root, file), "utf8"));

async function listFolder(folder) {
  try {
    const files = await fs.readdir(path.join(publicDir, folder));
    return files.filter((file) => RASTER.test(file)).map((file) => `/${folder}/${file}`);
  } catch {
    console.warn(`[images] missing folder public/${folder}`);
    return [];
  }
}

/** Every photo path the site renders, taken from the data files. */
async function collectSources() {
  const sources = new Set();
  const add = (src) => src && RASTER.test(src) && sources.add(src);

  const { activities } = await readJson("src/data/activities.json");
  for (const activity of activities) {
    if (activity.imageFolder) {
      for (const src of await listFolder(activity.imageFolder)) add(src);
    }
  }

  const { skills } = await readJson("src/data/skills.json");
  for (const category of skills) {
    category.images?.forEach(add);
    for (const subcategory of category.subcategories) {
      for (const tool of subcategory.tools) tool.popupImages?.forEach(add);
    }
  }

  const { publications } = await readJson("src/data/publications.json");
  for (const publication of publications) {
    for (const media of publication.media ?? []) {
      add(media.image);
      add(media.fullImage);
    }
  }

  const home = await readJson("src/data/home.json");
  home.portraits?.forEach(add);

  return [...sources].sort();
}

async function processImage(src, cacheIndex) {
  const buffer = await fs.readFile(path.join(publicDir, src));
  const hash = createHash("sha1")
    .update(PIPELINE)
    .update(buffer)
    .digest("hex")
    .slice(0, 12);

  const cached = cacheIndex[hash];
  if (cached) {
    const present = await Promise.all(
      cached.variants.map(([, file]) =>
        fs.access(path.join(cacheDir, file)).then(
          () => true,
          () => false,
        ),
      ),
    );
    if (present.every(Boolean)) return { hash, entry: cached, fresh: false };
  }

  const image = sharp(buffer, { failOn: "none" }).rotate();
  const variants = [];
  const seen = new Set();
  let size = null;

  for (const width of WIDTHS) {
    const { data, info } = await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    size = { width: info.width, height: info.height };
    if (seen.has(info.width)) continue;
    seen.add(info.width);
    const file = `${hash}-${info.width}.webp`;
    await fs.writeFile(path.join(cacheDir, file), data);
    variants.push([info.width, file]);
  }

  const blur = await image
    .clone()
    .resize({ width: 16 })
    .webp({ quality: 35 })
    .toBuffer();

  // `size` is the largest variant; scale it back to the source's full size.
  const metadata = await image.metadata();
  const rotated = (metadata.orientation ?? 1) >= 5;
  const width = (rotated ? metadata.height : metadata.width) ?? size.width;
  const height = (rotated ? metadata.width : metadata.height) ?? size.height;

  return {
    hash,
    fresh: true,
    entry: {
      width,
      height,
      blur: `data:image/webp;base64,${blur.toString("base64")}`,
      variants,
    },
  };
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index], index);
      }
    }),
  );
  return results;
}

async function main() {
  const started = Date.now();
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });

  const indexPath = path.join(cacheDir, "index.json");
  const cacheIndex = await fs
    .readFile(indexPath, "utf8")
    .then(JSON.parse)
    .catch(() => ({}));

  const sources = await collectSources();
  let processed = 0;
  const results = await runPool(
    sources,
    Math.max(1, Math.min(4, os.availableParallelism?.() ?? 4)),
    async (src) => {
      try {
        const result = await processImage(src, cacheIndex);
        if (result.fresh) {
          processed += 1;
          if (processed % 50 === 0) console.log(`[images] ${processed} resized…`);
        }
        return { src, ...result };
      } catch (error) {
        console.warn(`[images] skipped ${src}: ${error.message}`);
        return null;
      }
    },
  );

  const images = {};
  const nextIndex = {};
  const keep = new Set();
  for (const result of results) {
    if (!result) continue;
    const { src, hash, entry } = result;
    nextIndex[hash] = entry;
    images[src] = {
      width: entry.width,
      height: entry.height,
      blur: entry.blur,
      variants: entry.variants.map(([width, file]) => [width, `/_img/${file}`]),
    };
    for (const [, file] of entry.variants) {
      keep.add(file);
      const target = path.join(outputDir, file);
      await fs.access(target).catch(() =>
        fs.copyFile(path.join(cacheDir, file), target),
      );
    }
  }

  // Drop variants of photos that were removed or replaced.
  for (const directory of [outputDir, cacheDir]) {
    for (const file of await fs.readdir(directory)) {
      if (file.endsWith(".webp") && !keep.has(file)) {
        await fs.rm(path.join(directory, file), { force: true });
      }
    }
  }

  await fs.writeFile(indexPath, JSON.stringify(nextIndex));
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify({ version: 1, images }, null, 2)}\n`,
  );

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `[images] ${Object.keys(images).length} photos ready (${processed} resized) in ${seconds}s`,
  );
}

await main();
