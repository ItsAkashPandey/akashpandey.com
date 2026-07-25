import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const skills = JSON.parse(
  await fs.readFile(path.join(root, "src/data/skills.json"), "utf8"),
);
const outputDirectory = path.join(root, "public/skills/color");
await fs.mkdir(outputDirectory, { recursive: true });

const fallbackPalettes = [
  ["#2563eb", "#22b8cf"],
  ["#e76f51", "#f4a261"],
  ["#475569", "#94a3b8"],
  ["#0f766e", "#34d399"],
  ["#b45309", "#fbbf24"],
  ["#be185d", "#fb7185"],
];

function luminance(hex) {
  const values = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => parseInt(value, 16) / 255);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

let index = 0;
for (const category of skills.skills) {
  for (const subcategory of category.subcategories) {
    for (const tool of subcategory.tools) {
      const source = path.join(root, "public", tool.logo.replace(/^\//, ""));
      const filename = `${path.parse(tool.logo).name}.webp`;
      const output = path.join(outputDirectory, filename);
      const metadata = await sharp(source).metadata();
      const supplied = tool.gradient?.match(/#[a-fA-F0-9]{6}/g) ?? [];
      const palette =
        supplied.length >= 2 &&
        Math.max(luminance(supplied[0]), luminance(supplied[1])) > 0.15
          ? [supplied[0], supplied[1]]
          : fallbackPalettes[index % fallbackPalettes.length];
      const width = metadata.width ?? 256;
      const height = metadata.height ?? 256;
      const gradient = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="colour" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stop-color="${palette[0]}"/>
              <stop offset=".58" stop-color="${palette[1]}"/>
              <stop offset="1" stop-color="#e8f7ff"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#colour)"/>
        </svg>
      `);

      await sharp(gradient)
        .composite([{ input: source, blend: "dest-in" }])
        .webp({ quality: 90, alphaQuality: 95 })
        .toFile(output);
      index += 1;
    }
  }
}

console.log(`Generated ${index} colour-preserving skill marks.`);
