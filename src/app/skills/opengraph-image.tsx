import { getAllTools, getSkills } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Skills and field instruments of Dr. Akash Kumar";

export default async function Image() {
  return renderOgImage({
    kicker: "Skills",
    title: "Drones, GNSS, PhenoCams and the software behind them",
    subtitle: `${getAllTools().length} instruments and tools, used in the field and at the desk`,
    photo: getSkills()[0]?.images?.[0],
  });
}
