import { getActivityImages } from "@/lib/activity-images";
import { getActivities } from "@/lib/content";
import { getPhotos } from "@/lib/photos";
import { ActivityCard } from "./ActivityCard";
import ProgressiveActivitiesList, {
  type ActivityListItem,
} from "./ProgressiveActivitiesList";

export function getActivityListItems(): ActivityListItem[] {
  return getActivities().map((activity) => ({
    ...activity,
    photos: getPhotos(getActivityImages(activity)),
  }));
}

interface Props {
  /** Show only the newest few, as plain cards (the home page). */
  limit?: number;
}

export default function Activities({ limit }: Props) {
  const activities = getActivityListItems();

  if (limit) {
    return (
      <section className="flex flex-col gap-8">
        {activities.slice(0, limit).map((activity) => (
          <ActivityCard
            key={activity.slug}
            activity={activity}
            photos={activity.photos}
          />
        ))}
      </section>
    );
  }

  return <ProgressiveActivitiesList activities={activities} />;
}
