import data from "@/data/activities.json";
import { activitySchema } from "@/lib/schemas";
import LazyActivity from "./LazyActivity";
import ProgressiveActivitiesList from "./ProgressiveActivitiesList";
import { getImagesFromFolder } from "@/lib/imageResolver";

interface Props {
  limit?: number;
}

export default function Activities({ limit }: Props) {
  let activities = activitySchema.parse(data).activities;

  // Sort by date (newest first)
  activities = activities.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Resolve images dynamically from folder, fallback to JSON array
  const normalizeActivities = (source: typeof activities) =>
    source.map((activity, idx) => {
      const dynamicImages = getImagesFromFolder(activity.imageFolder);
      return {
        ...activity,
        resolvedImages: dynamicImages.length > 0 ? dynamicImages : (activity.resolvedImages || []),
        elementId: `activity-${idx}`,
      };
    });

  const allActivities = normalizeActivities(activities);

  if (limit) {
    const limitedActivities = allActivities.slice(0, limit);

    return (
      <div className="relative">
        <section className="flex flex-col gap-8">
          {limitedActivities.map((activity, index) => (
            <LazyActivity key={activity.elementId} activity={activity} index={index} initiallyVisible={true} />
          ))}
        </section>
      </div>
    );
  }

  return (
    <ProgressiveActivitiesList
      allActivities={allActivities}
      initialVisibleCount={5}
    />
  );
}

