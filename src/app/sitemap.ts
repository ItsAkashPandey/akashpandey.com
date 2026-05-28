import routesData from "@/data/routes.json";
import type { MetadataRoute } from "next";

const baseUrl = "https://www.akashpandey.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routesData.routes
    .filter((route) => route.path !== "/resume.pdf")
    .map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.path === "/" ? "weekly" : "monthly",
      priority: route.path === "/" ? 1 : 0.7,
    }));
}
