import routesData from "@/data/routes.json";
import siteData from "@/data/site.json";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${siteData.lastUpdated}T00:00:00.000Z`);

  return routesData.routes
    .filter((route) => route.path !== "/resume.pdf")
    .map((route) => ({
      url: `${siteData.url}${route.path}`,
      lastModified,
      changeFrequency: route.path === "/" ? "weekly" : "monthly",
      priority: route.path === "/" ? 1 : 0.7,
    }));
}
