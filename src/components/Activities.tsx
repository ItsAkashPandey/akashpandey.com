import fs from "fs";
import path from "path";
import data from "@/data/activities.json";
import { activitySchema } from "@/lib/schemas";
import LazyActivity from "./LazyActivity";
import TimelineBar from "./TimelineBar";

interface Props {
  limit?: number;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]);

function getImagesFromFolder(folderPath: string): string[] {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const fullPath = path.join(publicDir, folderPath);

    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const files = fs.readdirSync(fullPath);
    return files
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((file) => `/${folderPath.replace(/^\//, "")}/${file}`);
  } catch (error) {
    console.error(`Error reading image folder ${folderPath}:`, error);
    return [];
  }
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

  // Resolve images: if imageFolder is set, scan folder dynamically
  const activitiesWithImages = activities.map((activity, idx) => {
    let allImages: string[] = [];

    if (activity.imageFolder) {
      allImages = getImagesFromFolder(activity.imageFolder);
    } else if (activity.images?.length) {
      allImages = activity.images;
    } else if (activity.image) {
      allImages = [activity.image];
    }

    return { ...activity, resolvedImages: allImages, elementId: `activity-${idx}` };
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

