// Renders every skill logo in its own brand colour while keeping the artwork.
//
// The previous version poured a gradient through the alpha channel, which
// filled the silhouette and threw the picture away: a photographed PhenoCam
// came out as a green lozenge and a total station as a grey blob. This builds
// a duotone instead — luminance from the original, hue from the brand — so the
// shape survives and the colour is still the company's own.
//
// Run: npm run colorize-skills
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const skills = JSON.parse(
  await fs.readFile(path.join(root, "src/data/skills.json"), "utf8"),
);
const outputDirectory = path.join(root, "public/skills/color");
await fs.mkdir(outputDirectory, { recursive: true });

function parseHex(hex) {
  const [r, g, b] = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => parseInt(value, 16));
  return { r, g, b };
}

function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

const channels = ["r", "g", "b"];

function mix(colour, towards, amount) {
  return Object.fromEntries(
    channels.map((key) => [
      key,
      Math.round(colour[key] + (towards[key] - colour[key]) * amount),
    ]),
  );
}

/** Target luminance for each end of the ramp, whatever the brand colour is. */
const SHADOW_LUMINANCE = 0.14;
const HIGHLIGHT_LUMINANCE = 0.87;

/**
 * The two ends of the duotone ramp, both pinned to a fixed luminance so every
 * mark gets the same tonal separation. Mixing by a fixed *proportion* instead
 * left dark brands with no range at all: PhenoCam's green sits at 0.14, so a
 * black camera came out as one flat green lozenge no matter how the source was
 * stretched. Scaling to a luminance target keeps the hue and guarantees the
 * contrast.
 */
function duotoneRamp(brand) {
  const light = Math.max(luminance(brand), 0.02);

  const factor = SHADOW_LUMINANCE / light;
  const shadow = Object.fromEntries(
    channels.map((key) => [key, Math.min(255, Math.round(brand[key] * factor))]),
  );

  const towardsWhite = Math.min(
    1,
    Math.max(0, (HIGHLIGHT_LUMINANCE - light) / (1 - light)),
  );
  const highlight = mix(brand, { r: 255, g: 255, b: 255 }, towardsWhite);

  return { shadow, highlight };
}

let count = 0;
for (const category of skills.skills) {
  for (const subcategory of category.subcategories) {
    for (const tool of subcategory.tools) {
      const source = path.join(root, "public", tool.logo.replace(/^\//, ""));
      const name = path.parse(tool.logo).name;
      const output = path.join(outputDirectory, `${name}.webp`);

      const supplied = tool.gradient?.match(/#[a-fA-F0-9]{6}/g) ?? [];
      const { shadow, highlight } = duotoneRamp(
        parseHex(supplied[0] ?? "#3f6f7a"),
      );

      const { data, info } = await sharp(source)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Stretch across only the pixels that are actually drawn. Measuring the
      // transparent margin too would leave most marks using a sliver of the
      // ramp.
      let low = 255;
      let high = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 24) continue;
        const l =
          0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (l < low) low = l;
        if (l > high) high = l;
      }
      const span = Math.max(1, high - low);

      for (let i = 0; i < data.length; i += 4) {
        const l =
          0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const t = Math.min(1, Math.max(0, (l - low) / span));
        data[i] = shadow.r + (highlight.r - shadow.r) * t;
        data[i + 1] = shadow.g + (highlight.g - shadow.g) * t;
        data[i + 2] = shadow.b + (highlight.b - shadow.b) * t;
      }

      await sharp(data, { raw: info })
        .webp({ quality: 92, alphaQuality: 100 })
        .toFile(output);
      count += 1;
    }
  }
}

console.log(`wrote ${count} brand duotones to public/skills/color`);
