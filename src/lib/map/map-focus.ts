import type { MapPoint } from "./map-types";

function normalise(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

/**
 * Resolves the `?place=` or `?city=` query that other pages use to deep
 * link into the map (the globe's "more on the map" links, so far). `place`
 * is a places.json key and wins if present — it can still match more than
 * one point, since the IIT Roorkee campus carries activity, education and
 * experience pins at once. `city` is the slug from globe-data.ts's tour.
 * An id that matches nothing, or no param at all, returns no points, so a
 * stale or mistyped link just leaves the map at its opening view.
 */
export function focusedMapPoints(points: MapPoint[], search: string): MapPoint[] {
  const params = new URLSearchParams(search);

  const place = normalise(params.get("place"));
  if (place) return points.filter((point) => normalise(point.place) === place);

  const city = normalise(params.get("city"));
  if (city) return points.filter((point) => point.city === city);

  return [];
}
