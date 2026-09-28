import { getActivities, getCareer, getEducation } from "@/lib/content";
import { activityHref, formatActivityDate } from "@/lib/content-utils";
import type { MapData, MapPoint } from "@/lib/map/map-types";
import { getPlace, HOME_PLACE_ID } from "@/lib/places";
import type { Experience } from "@/lib/schemas";

/**
 * Same rule as the `slug()` in globe-data.ts, kept here too so a MapPoint's
 * city lines up with a GlobeStop's id without either file importing the
 * other.
 */
function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Builds the contact map's points on the server, so the page ships a few
 * kilobytes of places instead of the whole activities file. Activities are
 * grouped by place id; schools and employers get one point per organisation.
 */
export function buildMapData(): MapData {
  const points: MapPoint[] = [];

  const byPlace = new Map<string, MapPoint>();
  for (const activity of getActivities()) {
    let point = byPlace.get(activity.place);
    if (!point) {
      const place = getPlace(activity.place);
      point = {
        id: `activity:${activity.place}`,
        category: "activity",
        place: activity.place,
        city: slug(place.city),
        coordinates: place.coordinates,
        label: place.name,
        items: [],
      };
      byPlace.set(activity.place, point);
      points.push(point);
    }
    point.items.push({
      title: activity.name,
      when: formatActivityDate(activity.date, {
        month: "short",
        year: "numeric",
      }),
      href: activityHref(activity.slug),
    });
  }

  const addOrgs = (
    category: "education" | "experience",
    orgs: Experience[],
    href: string,
  ) => {
    for (const org of orgs) {
      // `place: null` marks a site that is deliberately left off the map.
      if (!org.place) continue;
      const place = getPlace(org.place);
      points.push({
        id: `${category}:${org.place}:${org.shortName}`,
        category,
        place: org.place,
        city: slug(place.city),
        coordinates: place.coordinates,
        label: org.shortName,
        website: org.href,
        items: org.positions.map((position) => ({
          title: position.title,
          when: `${position.start} – ${position.end ?? "Present"}`,
          href,
        })),
      });
    }
  };
  addOrgs("education", getEducation(), "/#education");
  addOrgs("experience", getCareer(), "/#work");

  const home = getPlace(HOME_PLACE_ID);
  return {
    home: { coordinates: home.coordinates, label: home.name },
    points,
  };
}
