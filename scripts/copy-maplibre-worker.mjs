// Copies MapLibre (the library, its tile worker and the module both of them
// import) into public/maplibre, where src/lib/map/load-maplibre.ts loads it
// from. Runs before `dev` and `build`, so it always matches the installed
// version.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const dist = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve("maplibre-gl/package.json"),
  ),
  "dist",
);
const dest = path.join(process.cwd(), "public", "maplibre");

mkdirSync(dest, { recursive: true });
for (const file of [
  "maplibre-gl.mjs",
  "maplibre-gl-worker.mjs",
  "maplibre-gl-shared.mjs",
]) {
  copyFileSync(path.join(dist, file), path.join(dest, file));
}
