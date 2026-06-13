import data from "@/data/activities.json";
import { activitySchema } from "@/lib/schemas";
import LazyActivity from "./LazyActivity";
import ProgressiveActivitiesList from "./ProgressiveActivitiesList";
import fs from "fs";
import path from "path";

interface Props {
  limit?: number;
}

export default function Activities({ limit }: Props) {
  let activities = activitySchema.parse(data).activities;

  // Sort by date (newest first)
  activities = activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const getImagesFromFolder = (folderName: string | undefined): string[] => {
    if (!folderName) return [];
    try {
      const publicPath = path.join(process.cwd(), "public", folderName);
      if (!fs.existsSync(publicPath)) return [];
      const files = fs.readdirSync(publicPath);
      return files
        .filter((file) => /\.(png|jpe?g|webp|gif|svg)$/i.test(file))
        .sort(compareActivityImageNames)
        .map((file) => `/${folderName}/${file}`);
    } catch {
      return [];
    }
  };

  // Resolve images dynamically from folder, fallback to JSON array
  const normalizeActivities = (source: typeof activities) =>
    source.map((activity, idx) => {
      const dynamicImages = getImagesFromFolder(activity.imageFolder);
      return {
        ...activity,
        resolvedImages:
          dynamicImages.length > 0
            ? dynamicImages
            : activity.resolvedImages || [],
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
            <LazyActivity
              key={activity.elementId}
              activity={activity}
              index={index}
              initiallyVisible={true}
            />
          ))}
        </section>
      </div>
    );
  }

  return (
    <ProgressiveActivitiesList
      allActivities={allActivities}
      initialVisibleCount={2}
    />
  );
}

function compareActivityImageNames(a: string, b: string) {
  const ak = getActivityImageSortKey(a);
  const bk = getActivityImageSortKey(b);

  if (ak.priority !== bk.priority) return ak.priority - bk.priority;
  if (ak.number !== bk.number) return ak.number - bk.number;
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getActivityImageSortKey(fileName: string) {
  const stem = path.parse(fileName).name.toLowerCase();
  const match = stem.match(/^0*(\d+)(?:\D|$)/);
  const number = match ? Number(match[1]) : Number.POSITIVE_INFINITY;

  return {
    number,
    priority:
      number === 1
        ? 0
        : Number.isFinite(number) && number > 1
          ? 1
          : number === 0
            ? 2
            : 3,
  };
}
