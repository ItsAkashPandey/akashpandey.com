import { getActivityImages } from "@/lib/activity-images";
import { getActivities, getActivity } from "@/lib/content";
import { formatActivityDate } from "@/lib/content-utils";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { getPlace } from "@/lib/places";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Activity from Dr. Akash Kumar's website";

export function generateStaticParams() {
  return getActivities().map((activity) => ({ slug: activity.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const activity = getActivity(slug);
  if (!activity) {
    return renderOgImage({ kicker: "Activities", title: "Dr. Akash Kumar" });
  }

  return renderOgImage({
    kicker: formatActivityDate(activity.date, {
      month: "long",
      year: "numeric",
    }),
    title: activity.name,
    subtitle: getPlace(activity.place).name,
    photo: getActivityImages(activity)[0],
  });
}
