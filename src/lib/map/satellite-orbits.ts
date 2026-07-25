import type {
  SatelliteOmm,
  SatelliteSnapshot,
} from "@/lib/map/satellite-types";
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  type OMMJsonObject,
  type SatRec,
} from "satellite.js";

export type TrackedSatellite = {
  record: SatelliteOmm;
  satrec: SatRec;
};

type TrackProperties = {
  phase: "past" | "future";
};

export type SatelliteTrack = GeoJSON.FeatureCollection<
  GeoJSON.LineString,
  TrackProperties
>;

function normaliseLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function headingBetween(
  first: [longitude: number, latitude: number],
  second: [longitude: number, latitude: number],
) {
  const firstLatitude = (first[1] * Math.PI) / 180;
  const secondLatitude = (second[1] * Math.PI) / 180;
  const longitudeDelta = ((second[0] - first[0]) * Math.PI) / 180;
  const y = Math.sin(longitudeDelta) * Math.cos(secondLatitude);
  const x =
    Math.cos(firstLatitude) * Math.sin(secondLatitude) -
    Math.sin(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.cos(longitudeDelta);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function propagatedPosition(satrec: SatRec, at: Date) {
  const state = propagate(satrec, at);
  if (!state) return null;

  const geodetic = eciToGeodetic(state.position, gstime(at));
  const longitude = normaliseLongitude(degreesLong(geodetic.longitude));
  const latitude = degreesLat(geodetic.latitude);
  if (![longitude, latitude, geodetic.height].every(Number.isFinite)) {
    return null;
  }

  return {
    longitude,
    latitude,
    altitudeKm: geodetic.height,
    speedKmS: Math.hypot(state.velocity.x, state.velocity.y, state.velocity.z),
  };
}

export function createTrackedSatellites(records: SatelliteOmm[]) {
  return records.flatMap((record) => {
    try {
      return [
        {
          record,
          satrec: json2satrec(record as OMMJsonObject),
        },
      ];
    } catch {
      return [];
    }
  });
}

export function satelliteSnapshot(
  tracked: TrackedSatellite,
  at: Date,
): SatelliteSnapshot | null {
  const current = propagatedPosition(tracked.satrec, at);
  const ahead = propagatedPosition(
    tracked.satrec,
    new Date(at.getTime() + 2_000),
  );
  if (!current || !ahead) return null;

  return {
    noradId: Number(tracked.record.NORAD_CAT_ID),
    name: tracked.record.OBJECT_NAME,
    ...current,
    bearing: headingBetween(
      [current.longitude, current.latitude],
      [ahead.longitude, ahead.latitude],
    ),
    observedAt: at,
  };
}

function splitAtAntimeridian(points: [number, number][]) {
  if (points.length < 2) return points.length ? [points] : [];
  const segments: [number, number][][] = [[points[0]]];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const delta = current[0] - previous[0];
    const segment = segments[segments.length - 1];

    if (Math.abs(delta) <= 180) {
      segment.push(current);
      continue;
    }

    const adjustedLongitude = delta > 180 ? current[0] - 360 : current[0] + 360;
    const boundary = adjustedLongitude > previous[0] ? 180 : -180;
    const progress =
      (boundary - previous[0]) / (adjustedLongitude - previous[0]);
    const latitude = previous[1] + (current[1] - previous[1]) * progress;
    segment.push([boundary, latitude]);
    segments.push([[-boundary, latitude], current]);
  }

  return segments.filter((segment) => segment.length > 1);
}

function pathHalf(
  tracked: TrackedSatellite,
  now: Date,
  startMinutes: number,
  endMinutes: number,
) {
  const points: [number, number][] = [];
  const stepMinutes = startMinutes <= endMinutes ? 1 : -1;

  for (
    let minute = startMinutes;
    stepMinutes > 0 ? minute <= endMinutes : minute >= endMinutes;
    minute += stepMinutes
  ) {
    const position = propagatedPosition(
      tracked.satrec,
      new Date(now.getTime() + minute * 60_000),
    );
    if (position) points.push([position.longitude, position.latitude]);
  }

  return splitAtAntimeridian(points);
}

export function satelliteGroundTrack(
  tracked: TrackedSatellite,
  now: Date,
): SatelliteTrack {
  const periodMinutes = 1_440 / Number(tracked.record.MEAN_MOTION);
  const halfPeriod = Math.min(120, Math.max(35, periodMinutes / 2));
  const phases: TrackProperties["phase"][] = ["past", "future"];
  const ranges: [number, number][] = [
    [-halfPeriod, 0],
    [0, halfPeriod],
  ];

  return {
    type: "FeatureCollection",
    features: phases.flatMap((phase, index) =>
      pathHalf(tracked, now, ranges[index][0], ranges[index][1]).map(
        (coordinates) => ({
          type: "Feature" as const,
          properties: { phase },
          geometry: {
            type: "LineString" as const,
            coordinates,
          },
        }),
      ),
    ),
  };
}
