import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Link previews for social apps and chat. Each page gets its own card — the
 * title in the site's serif, beside a photo from that page — instead of every
 * link unfurling to the same screenshot of the home page.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#f4f1e8";
const TEXT = "#2a2019";
const MUTED = "#6b5d50";
const INK = "#24585f";
const PHOTO_WIDTH = 500;

let fonts: Promise<[Buffer, Buffer]> | null = null;
/** Calistoga for titles; Geist (next/og's own default) for the small print. */
function loadFonts() {
  fonts ??= Promise.all([
    fs.readFile(
      path.join(
        process.cwd(),
        "src",
        "assets",
        "fonts",
        "Calistoga-Regular.ttf",
      ),
    ),
    fs.readFile(
      path.join(
        process.cwd(),
        "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
      ),
    ),
  ]);
  return fonts;
}

/** Satori cannot decode WebP, so the photo is re-encoded as a JPEG. */
async function photoDataUrl(src: string) {
  const file = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  const jpeg = await sharp(file)
    .rotate()
    .resize(PHOTO_WIDTH, OG_SIZE.height, {
      fit: "cover",
      position: "attention",
    })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

export async function renderOgImage({
  kicker,
  title,
  subtitle,
  photo,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  /** A path under public/. */
  photo?: string;
}) {
  const [[serif, sans], image] = await Promise.all([
    loadFonts(),
    photo ? photoDataUrl(photo).catch(() => null) : null,
  ]);
  const titleSize = title.length > 70 ? 50 : title.length > 42 ? 58 : 70;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: PAPER,
        color: TEXT,
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 60px 52px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            color: INK,
          }}
        >
          <div style={{ width: 44, height: 4, background: INK }} />
          {kicker}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontFamily: "Calistoga",
              fontSize: titleSize,
              lineHeight: 1.08,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 28, lineHeight: 1.35, color: MUTED }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
          akashpandey.com
        </div>
      </div>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
        <img
          src={image}
          alt=""
          width={PHOTO_WIDTH}
          height={OG_SIZE.height}
          style={{ objectFit: "cover" }}
        />
      )}
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: sans, style: "normal", weight: 400 },
        { name: "Calistoga", data: serif, style: "normal", weight: 400 },
      ],
    },
  );
}
