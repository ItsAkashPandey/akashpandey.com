import { getPublications } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Publications by Dr. Akash Kumar";

export default async function Image() {
  const publications = getPublications();
  const withFigure = publications.find((publication) => publication.media?.length);
  return renderOgImage({
    kicker: "Publications",
    title: "Papers on PhenoCam, crop phenology and remote sensing",
    subtitle: `${publications.length} journal papers, conference papers, chapters and drafts`,
    photo: withFigure?.media?.[0]?.image,
  });
}
