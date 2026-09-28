import { getActivityImages } from "@/lib/activity-images";
import { getActivities } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Activities of Dr. Akash Kumar";

export default async function Image() {
  const latest = getActivities().find(
    (activity) => getActivityImages(activity).length > 0,
  );
  return renderOgImage({
    kicker: "Activities",
    title: "Fieldwork, talks and startup milestones",
    subtitle: `${getActivities().length} activities since 2022, with photos`,
    photo: latest ? getActivityImages(latest)[0] : undefined,
  });
}
