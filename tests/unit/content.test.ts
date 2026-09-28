import { getActivityImages } from "@/lib/activity-images";
import {
  getActivities,
  getAllTools,
  getCareer,
  getEducation,
  getPublications,
} from "@/lib/content";
import { buildGlobeData } from "@/lib/globe-data";
import { buildMapData } from "@/lib/map/map-data";
import { getPlace, HOME_PLACE_ID } from "@/lib/places";
import { describe, expect, it } from "vitest";

describe("content data", () => {
  it("gives every activity a unique, permanent slug", () => {
    const slugs = getActivities().map((activity) => activity.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("lists activities newest first", () => {
    const dates = getActivities().map((activity) => activity.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("has photos for every activity folder", () => {
    for (const activity of getActivities()) {
      if (activity.imageFolder) {
        expect(getActivityImages(activity).length, activity.slug).toBeGreaterThan(0);
      }
    }
  });

  it("gives every publication a unique slug", () => {
    const slugs = getPublications().map((publication) => publication.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("parses careers, education and skills", () => {
    expect(getCareer().length).toBeGreaterThan(0);
    expect(getEducation().length).toBeGreaterThan(0);
    expect(getAllTools().length).toBeGreaterThan(20);
  });
});

describe("contact map points", () => {
  const data = buildMapData();

  it("puts every activity on the map exactly once", () => {
    const hrefs = data.points
      .filter((point) => point.category === "activity")
      .flatMap((point) => point.items.map((item) => item.href));
    expect(hrefs).toHaveLength(getActivities().length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("includes the KVK farmer outreach that used to be dropped", () => {
    const hrefs = data.points.flatMap((point) => point.items.map((item) => item.href));
    expect(hrefs).toContain("/activities/kvk-farmer-outreach-2023");
  });

  it("links popups to the permanent activity pages", () => {
    for (const point of data.points.filter((p) => p.category === "activity")) {
      for (const item of point.items) expect(item.href).toMatch(/^\/activities\/[a-z0-9-]+$/);
    }
  });
});

describe("buildGlobeData", () => {
  const globe = buildGlobeData();

  it("starts the tour at home and visits every city once", () => {
    expect(globe.stops[0].city).toBe("Roorkee");
    const cities = globe.stops.map((stop) => stop.city);
    expect(new Set(cities).size).toBe(cities.length);
  });

  it("puts the home dot on the campus", () => {
    expect(globe.stops[0].coordinates).toEqual(getPlace(HOME_PLACE_ID).coordinates);
    expect(globe.stops[0].distanceKm).toBe(0);
  });

  it("keeps every activity, role and programme", () => {
    const items = globe.stops.reduce((sum, stop) => sum + stop.items.length, 0);
    const points = buildMapData().points.reduce((sum, point) => sum + point.items.length, 0);
    expect(items).toBe(points);
  });

  it("summarises the spread", () => {
    expect(globe.north).toBe("Srinagar");
    expect(globe.south).toBe("Bengaluru");
    expect(globe.abroad).toEqual(["Vienna"]);
    expect(globe.countries).toBe(2);
  });
});
