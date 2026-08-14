import activitiesData from "@/data/activities.json";
import activityLocations from "@/data/activity-locations.json";
import { activitySchema } from "@/lib/schemas";

export type ActivityPoint = {
  coordinates: [number, number];
  activities: { name: string; date: string }[];
};

const locations = activityLocations as unknown as Record<
  string,
  [number, number]
>;

/** Groups every geocodable activity onto its location, so a place visited
 * more than once (IIT Roorkee, KVK Dhanauri, ...) collapses to one point. */
export function buildActivityPoints(): ActivityPoint[] {
  const { activities } = activitySchema.parse(activitiesData);
  const byKey = new Map<string, ActivityPoint>();

  for (const activity of activities) {
    const coordinates = activity.location ? locations[activity.location] : undefined;
    if (!coordinates) continue;

    const key = coordinates.join(",");
    const point = byKey.get(key);
    if (point) {
      point.activities.push({ name: activity.name, date: activity.date });
    } else {
      byKey.set(key, {
        coordinates,
        activities: [{ name: activity.name, date: activity.date }],
      });
    }
  }

  return [...byKey.values()];
}
