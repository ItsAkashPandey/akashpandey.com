import placesData from "@/data/places.json";
import { placesSchema, type Place } from "@/lib/schemas";

const places = placesSchema.parse(placesData);

/** Where the map's "Akash" pin sits: the campus, not a building on it. */
export const HOME_PLACE_ID = "iit-roorkee";

export function hasPlace(id: string) {
  return Object.hasOwn(places, id);
}

/**
 * Looks up a place id from the data files. An unknown id throws, so a typo in
 * activities.json, career.json or education.json fails the build instead of
 * quietly dropping a pin from the map.
 */
export function getPlace(id: string): Place {
  const place = places[id];
  if (!place) {
    throw new Error(
      `Unknown place "${id}". Add it to src/data/places.json or fix the id.`,
    );
  }
  return place;
}
