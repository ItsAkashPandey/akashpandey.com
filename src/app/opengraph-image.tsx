import homeContent from "@/data/home.json";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Dr. Akash Kumar, geospatial researcher";

export default async function Image() {
  return renderOgImage({
    kicker: "Geospatial research · IIT Roorkee",
    title: "Dr. Akash Kumar",
    subtitle:
      "Crop and vegetation phenology with PhenoCams, UAVs and satellite data.",
    photo: homeContent.portraits.at(-1),
  });
}
