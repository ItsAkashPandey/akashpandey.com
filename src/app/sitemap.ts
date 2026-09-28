import homeContent from "@/data/home.json";
import routesData from "@/data/routes.json";
import siteData from "@/data/site.json";
import { getActivityImages } from "@/lib/activity-images";
import { getActivities, getPublications } from "@/lib/content";
import { activityHref, publicationHref } from "@/lib/content-utils";
import { getPhoto } from "@/lib/photos";
import type { MetadataRoute } from "next";

/**
 * The web-sized copy of a photo (what the pages actually show), so image
 * search indexes the same file visitors see.
 */
function imageUrl(src: string) {
  const photo = getPhoto(src, false);
  const width = photo.widths?.includes(1280) ? 1280 : photo.widths?.at(-1);
  return `${siteData.url}${photo.hash && width ? `/_img/${photo.hash}-${width}.webp` : src}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(
    `${process.env.SITE_LAST_UPDATED ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
  );

  const pages = routesData.routes
    .filter((route) => route.path.startsWith("/") && !route.path.includes("."))
    .map((route) => ({
      url: `${siteData.url}${route.path === "/" ? "" : route.path}`,
      lastModified,
      changeFrequency: route.path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: route.path === "/" ? 1 : 0.7,
      ...(route.path === "/"
        ? { images: homeContent.portraits.map(imageUrl) }
        : {}),
    }));

  const activities = getActivities().map((activity) => ({
    url: `${siteData.url}${activityHref(activity.slug)}`,
    lastModified: new Date(`${activity.date}T00:00:00.000Z`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
    images: getActivityImages(activity).slice(0, 6).map(imageUrl),
  }));

  // Drafts in preparation have a page, but nothing worth indexing yet.
  const publications = getPublications()
    .filter((publication) => publication.status !== "In Preparation")
    .map((publication) => ({
      url: `${siteData.url}${publicationHref(publication.slug)}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));

  return [...pages, ...activities, ...publications];
}
