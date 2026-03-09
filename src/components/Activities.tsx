import data from "@/data/activities.json";
import { activitySchema } from "@/lib/schemas";
import LazyActivity from "./LazyActivity";
import TimelineBar from "./TimelineBar";

interface Props {
  limit?: number;
}

export default function Activities({ limit }: Props) {
  let activities = activitySchema.parse(data).activities;

  // Sort by date (newest first)
  activities = activities.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (limit) {
    activities = activities.slice(0, limit);
  }

  // Use pre-resolved images from the JSON
  const activitiesWithImages = activities.map((activity, idx) => {
    return {
      ...activity,
      resolvedImages: activity.resolvedImages || [],
      elementId: `activity-${idx}`
    };
  });

  // Build timeline entries for the bar
  const timelineEntries = activitiesWithImages.map((a) => ({
    id: a.elementId,
    date: a.date,
  }));

  return (
    <div className="relative">
      <section className="flex flex-col gap-8">
        {activitiesWithImages.map((activity, index) => (
          <LazyActivity key={activity.elementId} activity={activity} index={index} />
        ))}
      </section>

      {/* Timeline bar — only rendered when not limited (full page) */}
      {!limit && <TimelineBar entries={timelineEntries} />}
    </div>
  );
}

