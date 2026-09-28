import { focusedMapPoints } from "@/lib/map/map-focus";
import type { MapPoint, MarkerCategory } from "@/lib/map/map-types";
import { describe, expect, it } from "vitest";

function point(
  id: string,
  place: string,
  city: string,
  category: MarkerCategory = "activity",
): MapPoint {
  return { id, category, place, city, coordinates: [0, 0], label: id, items: [] };
}

// Roorkee is deliberately over-represented: it is the one city where a
// single place id (iit-roorkee) carries more than one category, and where
// a city carries more than one place id — exactly the two ways a
// ?place=/?city= link can resolve to several points at once.
const points: MapPoint[] = [
  point("activity:kvk-dhanauri", "kvk-dhanauri", "haridwar"),
  point("education:iit-roorkee:phd", "iit-roorkee", "roorkee", "education"),
  point("experience:iit-roorkee:postdoc", "iit-roorkee", "roorkee", "experience"),
  point("activity:mac-iit-roorkee", "mac-iit-roorkee", "roorkee"),
  point("activity:austria-center-vienna", "austria-center-vienna", "vienna"),
];

const idsOf = (matches: MapPoint[]) => matches.map((match) => match.id).sort();

describe("focusedMapPoints", () => {
  it("matches a single place id", () => {
    expect(idsOf(focusedMapPoints(points, "?place=kvk-dhanauri"))).toEqual([
      "activity:kvk-dhanauri",
    ]);
  });

  it("matches every point sharing a place id", () => {
    expect(idsOf(focusedMapPoints(points, "?place=iit-roorkee"))).toEqual(
      ["education:iit-roorkee:phd", "experience:iit-roorkee:postdoc"].sort(),
    );
  });

  it("matches every point in a city, across place ids", () => {
    expect(idsOf(focusedMapPoints(points, "?city=roorkee"))).toEqual(
      [
        "activity:mac-iit-roorkee",
        "education:iit-roorkee:phd",
        "experience:iit-roorkee:postdoc",
      ].sort(),
    );
  });

  it("ignores an id that matches nothing, rather than throwing", () => {
    expect(focusedMapPoints(points, "?place=nowhere")).toEqual([]);
    expect(focusedMapPoints(points, "?city=nowhere")).toEqual([]);
  });

  it("returns nothing when neither param is present", () => {
    expect(focusedMapPoints(points, "")).toEqual([]);
    expect(focusedMapPoints(points, "?other=1")).toEqual([]);
  });

  it("matches regardless of case or stray whitespace", () => {
    expect(idsOf(focusedMapPoints(points, "?place=%20KVK-Dhanauri%20"))).toEqual([
      "activity:kvk-dhanauri",
    ]);
    expect(idsOf(focusedMapPoints(points, "?city=VIENNA"))).toEqual([
      "activity:austria-center-vienna",
    ]);
  });

  it("prefers place over city when both are given", () => {
    expect(idsOf(focusedMapPoints(points, "?place=kvk-dhanauri&city=vienna"))).toEqual([
      "activity:kvk-dhanauri",
    ]);
  });
});
