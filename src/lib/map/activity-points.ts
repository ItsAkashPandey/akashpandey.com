import activitiesData from "@/data/activities.json";
import activityLocations from "@/data/activity-locations.json";
import { activitySchema } from "@/lib/schemas";

export type ActivityPoint = {
  coordinates: [number, number];
  /** Shortest of the grouped location strings — "IIT Roorkee" over "MAC,
   *  IIT Roorkee" — so the popup header reads like a place, not an address. */
  label: string;
  activities: { name: string; date: string; href: string }[];
};

const locations = activityLocations as unknown as Record<
  string,
  [number, number]
>;

/** Groups every geocodable activity onto its location, so a place visited
 * more than once (IIT Roorkee, KVK Dhanauri, ...) collapses to one point.
 * Each activity's href is `/activities#activity-{idx}`, where idx matches
 * the newest-first index Activities.tsx and ProgressiveActivitiesList both
 * assign — the same index the list's hash deep-link already knows how to
 * reveal and scroll to. */
export function buildActivityPoints(): ActivityPoint[] {
  const { activities } = activitySchema.parse(activitiesData);
  const sorted = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const byKey = new Map<string, ActivityPoint>();

  sorted.forEach((activity, idx) => {
    const coordinates = activity.location
      ? locations[activity.location]
      : undefined;
    if (!coordinates) return;

    const key = coordinates.join(",");
    const entry = {
      name: activity.name,
      date: activity.date,
      href: `/activities#activity-${idx}`,
    };
    const point = byKey.get(key);
    if (point) {
      point.activities.push(entry);
      if ((activity.location?.length ?? 0) < point.label.length) {
        point.label = activity.location!;
      }
    } else {
      byKey.set(key, {
        coordinates,
        label: activity.location!,
        activities: [entry],
      });
    }
  });

  return [...byKey.values()];
}
