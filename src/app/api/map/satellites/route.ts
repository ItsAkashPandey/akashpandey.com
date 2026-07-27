import {
  CELESTRAK_EARTH_OBSERVATION_URLS,
  CELESTRAK_RESOURCE_URL,
  createFallbackSatelliteFeed,
  MAX_TRACKED_SATELLITES,
  SATELLITE_FALLBACK_RECORDS,
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
    const trackedIds = new Set<number>(TRACKED_NORAD_IDS);
    const responses = await Promise.allSettled(
      CELESTRAK_EARTH_OBSERVATION_URLS.map(async (url) => {
        const response = await fetch(url, {
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
        return payload.filter(isSatelliteOmm);
      }),
    );

    const liveRecords = responses.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    if (liveRecords.length < 4) {
      throw new Error("CelesTrak returned too few tracked satellites");
    }

    const byNoradId = new Map<number, SatelliteOmm>();
    for (const record of [...SATELLITE_FALLBACK_RECORDS, ...liveRecords]) {
      byNoradId.set(Number(record.NORAD_CAT_ID), record);
    }

    // The curated missions lead, then the rest of the live fleet fills the slots
    // that remain, newest element sets first.
    const curated = TRACKED_NORAD_IDS.flatMap((id) => {
      const record = byNoradId.get(id);
      return record ? [record] : [];
    });

    const remaining = [...byNoradId.values()]
      .filter((record) => !trackedIds.has(Number(record.NORAD_CAT_ID)))
      .sort((a, b) => b.EPOCH.localeCompare(a.EPOCH));

    const records = [...curated, ...remaining].slice(
      0,
      MAX_TRACKED_SATELLITES,
    );

    if (records.length < SATELLITE_FALLBACK_RECORDS.length) {
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
