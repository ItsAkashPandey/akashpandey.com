// The NASA source sequences carry burnt-in annotation — an "Elapsed: 0 days
// 1.42 hours" counter in the top-left corner and satellite name labels dotted
// around the globe. The scroll layer only shows the outer margins of the frame,
// which is exactly where the corner counter lands, so it surfaced on the page
// as blurred writing behind the background.
//
// Cropping alone cannot fix it: the labels sit on the globe, not just at the
// edges. This trims the annotated border and bakes in enough blur that no text
// can resolve at any size, which costs nothing here — the layer exists to be
// ambient movement, never to be read.
//
// Run: node scripts/soften-motion-clips.mjs
import { access, mkdir, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const SOURCE_DIR = "public/motion";
const ARCHIVE_DIR = "public/motion/_originals";

const exists = async (file) =>
  access(file).then(
    () => true,
    () => false,
  );

await mkdir(ARCHIVE_DIR, { recursive: true });

const clips = (await readdir(SOURCE_DIR)).filter((file) =>
  file.endsWith(".mp4"),
);

for (const clip of clips) {
  const target = path.join(SOURCE_DIR, clip);
  const archive = path.join(ARCHIVE_DIR, clip);

  // Always encode from the untouched original, so re-running cannot stack
  // blur passes on top of each other.
  if (!(await exists(archive))) {
    await run("ffmpeg", ["-v", "error", "-i", target, "-c", "copy", archive]);
  }

  await run("ffmpeg", [
    "-v", "error",
    "-i", archive,
    "-vf",
    // Trim the annotated border, blur past legibility, then rescale. Half
    // resolution is plenty for a layer that is blurred again in CSS.
    "crop=iw*0.86:ih*0.86,gblur=sigma=16,scale=640:-2,format=yuv420p",
    "-an",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "30",
    "-movflags", "+faststart",
    "-y", target,
  ]);

  console.log(`softened ${clip}`);
}
