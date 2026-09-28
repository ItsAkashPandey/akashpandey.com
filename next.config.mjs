import { execSync } from "node:child_process";

/**
 * The date of the last commit, for the footer's "Updated" line and the
 * sitemap. Falls back to the build date when git history is not available.
 */
function lastUpdated() {
  try {
    const date = execSync("git log -1 --format=%cs", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch {
    // Shallow or missing clone.
  }
  return new Date().toISOString().slice(0, 10);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SITE_LAST_UPDATED: lastUpdated(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), payment=(), usb=(), browsing-topics=(), geolocation=(self)",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            // Only the parts that can't block the map tiles, fonts or the
            // spam check. Locking down scripts properly needs per-request
            // nonces, which would turn every static page dynamic.
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
          },
        ],
      },
      {
        // Pre-sized photos from scripts/build-images.mjs. The file names carry
        // a content hash, so they can be cached for good.
        source: "/_img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
  images: {
    // WebP only: AVIF is a little smaller but several times slower to encode,
    // and the optimiser encodes on the first request for every size.
    formats: ["image/webp"],
    qualities: [70, 75, 80, 82, 84, 85, 86, 88, 90, 92],
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
  },
  // Kasi reads its profile from disk at request time.
  outputFileTracingIncludes: {
    "/api/chat": ["./src/data/profile.md"],
  },
  outputFileTracingExcludes: {
    "*": [
      "public/**/*",
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
    ],
  },
};

export default nextConfig;
