import { buildMapData } from "@/lib/map/map-data";
import { distanceKm } from "@/lib/map/map-geometry";
import type { LngLat, MarkerCategory } from "@/lib/map/map-types";
import { getPlace, HOME_PLACE_ID } from "@/lib/places";

export type GlobeItem = {
  title: string;
  when: string;
  href: string;
  category: MarkerCategory;
  /** The place's own name, e.g. "KVK Dhanauri, Haridwar". */
  place: string;
};

/** Everything in one city: one dot on the globe, one stop on the tour. */
export type GlobeStop = {
  id: string;
  city: string;
  country: string;
  coordinates: LngLat;
  /** Great-circle distance from home, rounded to 10 km. */
  distanceKm: number;
  counts: Record<MarkerCategory, number>;
  items: GlobeItem[];
};

export type GlobeData = {
  stops: GlobeStop[];
  countries: number;
  north: string;
  south: string;
  abroad: string[];
};

const CATEGORY_ORDER: MarkerCategory[] = ["experience", "education", "activity"];

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Groups the map's points by city for the home page globe, ordered as a
 * tour: home first, then always the nearest city not yet visited, so
 * stepping through it moves the globe a little at a time.
 */
export function buildGlobeData(): GlobeData {
  const home = getPlace(HOME_PLACE_ID);
  const byCity = new Map<string, GlobeStop & { weight: Map<string, number> }>();

  const points = [...buildMapData().points].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  for (const point of points) {
    const place = getPlace(point.place);
    const id = slug(place.city);
    let stop = byCity.get(id);
    if (!stop) {
      stop = {
        id,
        city: place.city,
        country: place.country,
        coordinates: place.coordinates,
        distanceKm: 0,
        counts: { activity: 0, education: 0, experience: 0 },
        items: [],
        weight: new Map(),
      };
      byCity.set(id, stop);
    }
    stop.counts[point.category] += point.items.length;
    stop.weight.set(point.place, (stop.weight.get(point.place) ?? 0) + point.items.length);
    for (const item of point.items) {
      stop.items.push({ ...item, category: point.category, place: place.name });
    }
  }

  const stops = [...byCity.values()].map(({ weight, ...stop }) => {
    // The dot sits on the busiest place in the city (home, for Roorkee).
    const [busiest] = [...weight.entries()].sort((a, b) =>
      a[0] === HOME_PLACE_ID ? -1 : b[0] === HOME_PLACE_ID ? 1 : b[1] - a[1],
    );
    const coordinates = getPlace(busiest[0]).coordinates;
    return {
      ...stop,
      coordinates,
      distanceKm: Math.round(distanceKm(home.coordinates, coordinates) / 10) * 10,
    };
  });

  const start = stops.find((stop) => stop.city === home.city) ?? stops[0];
  const tour: GlobeStop[] = [];
  const left = new Set(stops);
  let current: GlobeStop | undefined = start;
  while (current) {
    tour.push(current);
    left.delete(current);
    let next: GlobeStop | undefined;
    let best = Infinity;
    for (const stop of left) {
      const distance = distanceKm(current.coordinates, stop.coordinates);
      if (distance < best) {
        best = distance;
        next = stop;
      }
    }
    current = next;
  }

  const inIndia = tour.filter((stop) => stop.country === "India");
  const byLatitude = [...inIndia].sort((a, b) => b.coordinates[1] - a.coordinates[1]);

  return {
    stops: tour,
    countries: new Set(tour.map((stop) => stop.country)).size,
    north: byLatitude[0]?.city ?? "",
    south: byLatitude.at(-1)?.city ?? "",
    abroad: tour.filter((stop) => stop.country !== "India").map((stop) => stop.city),
  };
}
