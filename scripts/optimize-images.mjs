import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const workspaceRoot = process.cwd();
const publicRoot = path.resolve(workspaceRoot, "public");
const dryRun = process.argv.includes("--dry-run");
const MAX_PARALLEL = 4;

const krishiTechImages = [
  {
    input: "WhatsApp Image 2026-07-03 at 9.04.43 AM.jpeg",
    output: "01-team-at-ihfc.webp",
  },
  {
    input: "WhatsApp Image 2026-07-03 at 9.04.39 AM.jpeg",
    output: "02-team-at-ihfc.webp",
  },
  {
    input: "WhatsApp Image 2026-07-03 at 9.04.40 AM.jpeg",
    output: "03-team-at-ihfc.webp",
  },
  {
    input: "CropLizer Suite IHFC PPT AgriTech Synapse PPT-updated v2.png",
    output: "04-croplizer-geoai-suite.webp",
  },
];

function assertInsidePublic(filePath) {
  const resolved = path.resolve(filePath);
  if (
    resolved !== publicRoot &&
    !resolved.startsWith(`${publicRoot}${path.sep}`)
  ) {
    throw new Error(`Refusing to modify a path outside public/: ${resolved}`);
  }
  return resolved;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function prepareKrishiTechImages() {
  const folder = assertInsidePublic(
    path.join(publicRoot, "KrishiTech_IIT_Delhi"),
  );
  if (!(await exists(folder))) return;

  for (const image of krishiTechImages) {
    const input = assertInsidePublic(path.join(folder, image.input));
    const output = assertInsidePublic(path.join(folder, image.output));
    if (!(await exists(input))) continue;

    if (dryRun) {
      console.log(
        `[prepare] ${path.relative(publicRoot, input)} -> ${image.output}`,
      );
      continue;
    }

    const temporary = `${output}.tmp`;
    await sharp(input)
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: image.output.includes("croplizer") ? 88 : 84,
        alphaQuality: 90,
        effort: 5,
        smartSubsample: true,
      })
      .toFile(temporary);
    await fs.rename(temporary, output);
    await fs.rm(input);
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(fullPath) : [fullPath];
    }),
  );
  return nested.flat();
}

function imagePolicy(filePath) {
  const relative = path.relative(publicRoot, filePath).replaceAll("\\", "/");
  const isPublication = relative.startsWith("publications/");
  const isPoster =
    /poster|slide|screenshot|certificate|croplizer|presentation/i.test(
      relative,
    );

  return {
    maxEdge: isPublication || isPoster ? 2400 : 2000,
    quality: isPublication || isPoster ? 88 : 84,
    minimumBytes: isPublication || isPoster ? 520_000 : 360_000,
  };
}

async function inspectCandidate(filePath) {
  if (path.extname(filePath).toLowerCase() !== ".webp") return null;

  const [metadata, stats] = await Promise.all([
    sharp(filePath).metadata(),
    fs.stat(filePath),
  ]);
  const policy = imagePolicy(filePath);
  const longestEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);

  if (longestEdge <= policy.maxEdge && stats.size <= policy.minimumBytes) {
    return null;
  }

  return {
    filePath,
    beforeBytes: stats.size,
    longestEdge,
    ...policy,
  };
}

async function optimize(candidate) {
  const temporary = `${candidate.filePath}.tmp`;
  if (dryRun) return { ...candidate, afterBytes: candidate.beforeBytes };

  await sharp(candidate.filePath)
    .rotate()
    .resize({
      width: candidate.maxEdge,
      height: candidate.maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: candidate.quality,
      alphaQuality: 90,
      effort: 5,
      smartSubsample: true,
    })
    .toFile(temporary);

  const outputStats = await fs.stat(temporary);
  if (outputStats.size < candidate.beforeBytes) {
    await fs.rename(temporary, candidate.filePath);
    return { ...candidate, afterBytes: outputStats.size };
  }

  await fs.rm(temporary);
  return { ...candidate, afterBytes: candidate.beforeBytes };
}

async function runPool(items, worker) {
  const results = [];
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MAX_PARALLEL, items.length) }, next),
  );
  return results;
}

await prepareKrishiTechImages();

const files = (await walk(publicRoot)).map(assertInsidePublic);
const inspected = await runPool(files, inspectCandidate);
const candidates = inspected.filter(Boolean);

console.log(
  `${dryRun ? "Would optimize" : "Optimizing"} ${candidates.length} WebP images...`,
);

const results = await runPool(candidates, optimize);
const beforeBytes = results.reduce((sum, item) => sum + item.beforeBytes, 0);
const afterBytes = results.reduce((sum, item) => sum + item.afterBytes, 0);

console.log(
  `${dryRun ? "Candidate size" : "Optimized"}: ${(beforeBytes / 1_048_576).toFixed(1)} MB -> ${(afterBytes / 1_048_576).toFixed(1)} MB`,
);
