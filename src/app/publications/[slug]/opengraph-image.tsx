import { getPublication, getPublications } from "@/lib/content";
import { publicationVenue } from "@/lib/content-utils";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Publication by Dr. Akash Kumar";

export function generateStaticParams() {
  return getPublications().map((publication) => ({ slug: publication.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const publication = getPublication(slug);
  if (!publication) {
    return renderOgImage({ kicker: "Publications", title: "Dr. Akash Kumar" });
  }
  return renderOgImage({
    kicker: `${publication.type} · ${publication.year}`,
    title: publication.title,
    subtitle: publicationVenue(publication) || publication.status,
    photo: publication.media?.[0]?.image,
  });
}
