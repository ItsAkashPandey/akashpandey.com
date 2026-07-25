import {
  CELESTRAK_RESOURCE_URL,
  createFallbackSatelliteFeed,
  TRACKED_NORAD_IDS,
} from "@/data/satellite-fallback";
import type { SatelliteFeed, SatelliteOmm } from "@/lib/map/satellite-types";

export const revalidate = 21_600;

const numericFields: (keyof SatelliteOmm)[] = [
  "MEAN_MOTION",
  "ECCENTRICITY",
  "INCLINATION",
  "RA_OF_ASC_NODE",
  "ARG_OF_PERICENTER",
  "MEAN_ANOMALY",
  "NORAD_CAT_ID",
  "ELEMENT_SET_NO",
  "BSTAR",
  "MEAN_MOTION_DOT",
  "MEAN_MOTION_DDOT",
];

function isSatelliteOmm(value: unknown): value is SatelliteOmm {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.OBJECT_NAME === "string" &&
    typeof record.OBJECT_ID === "string" &&
    typeof record.EPOCH === "string" &&
    Number.isFinite(Date.parse(record.EPOCH)) &&
    numericFields.every((field) => Number.isFinite(Number(record[field])))
  );
}

function latestEpoch(records: SatelliteOmm[]) {
  return records.reduce(
    (latest, record) => (record.EPOCH > latest ? record.EPOCH : latest),
    "",
  );
}

export async function GET() {
  let feed: SatelliteFeed;

  try {
    const response = await fetch(CELESTRAK_RESOURCE_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`CelesTrak returned ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("CelesTrak returned an invalid payload");
    }

    const trackedIds = new Set<number>(TRACKED_NORAD_IDS);
    const records = payload
      .filter(isSatelliteOmm)
      .filter((record) => trackedIds.has(Number(record.NORAD_CAT_ID)));

    if (records.length < 4) {
      throw new Error("CelesTrak returned too few tracked satellites");
    }

    const updatedAt = latestEpoch(records);
    feed = {
      provider: "CelesTrak",
      mode: "celestrak",
      sourceUrl: CELESTRAK_RESOURCE_URL,
      updatedAt,
      servedAt: new Date().toISOString(),
      stale: Date.now() - Date.parse(updatedAt) > 7 * 24 * 60 * 60 * 1_000,
      records,
    };
  } catch {
    feed = createFallbackSatelliteFeed();
  }

  return Response.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
