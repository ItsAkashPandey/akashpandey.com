import routesData from "@/data/routes.json";
import {
  getActivities,
  getCareer,
  getEducation,
  getPublications,
  getSkills,
} from "@/lib/content";
import {
  activityHref,
  formatActivityDate,
  plainText,
  publicationHref,
  publicationVenue,
  toolSlug,
  truncate,
} from "@/lib/content-utils";
import { getPlace } from "@/lib/places";

export const SEARCH_GROUPS = [
  "Pages",
  "Activities",
  "Publications",
  "Skills",
  "Experience",
] as const;

export type SearchEntry = {
  group: (typeof SEARCH_GROUPS)[number];
  title: string;
  /** The second line: a date, a venue, an organisation. */
  detail: string;
  href: string;
  /** Extra words to match on that aren't shown. */
  keywords?: string[];
};

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/resume.pdf": "Resume (PDF)",
};

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Everything the search palette can jump to, built once at build time and
 * served as /search-index.json, so none of it ships in the page bundles.
 */
export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const route of routesData.routes) {
    entries.push({
      group: "Pages",
      title: PAGE_TITLES[route.path] ?? capitalise(route.name),
      detail: route.description,
      href: route.path,
    });
  }

  for (const activity of getActivities()) {
    const place = getPlace(activity.place);
    entries.push({
      group: "Activities",
      title: activity.name,
      detail: `${formatActivityDate(activity.date, { month: "short", year: "numeric" })} · ${place.city}`,
      href: activityHref(activity.slug),
      keywords: [
        activity.location,
        activity.category,
        truncate(plainText(activity.description), 140),
      ],
    });
  }

  for (const publication of getPublications()) {
    const venue = publicationVenue(publication);
    entries.push({
      group: "Publications",
      title: publication.title,
      detail: [publication.type, venue, publication.year].filter(Boolean).join(" · "),
      href: publicationHref(publication.slug),
      keywords: [publication.authors, publication.status],
    });
  }

  for (const category of getSkills()) {
    for (const subcategory of category.subcategories) {
      for (const tool of subcategory.tools) {
        entries.push({
          group: "Skills",
          title: tool.name,
          detail: tool.model && tool.model !== tool.name
            ? `${tool.model} · ${subcategory.name}`
            : subcategory.name,
          href: `/skills#${toolSlug(tool.name)}`,
          keywords: [category.mainCategory, ...(tool.aliases ?? []), ...tool.tasks.slice(0, 3)],
        });
      }
    }
  }

  const addPositions = (
    orgs: ReturnType<typeof getCareer>,
    href: string,
  ) => {
    for (const org of orgs) {
      for (const position of org.positions) {
        entries.push({
          group: "Experience",
          title: position.title,
          detail: `${org.name} · ${position.start} – ${position.end ?? "Present"}`,
          href,
          keywords: [org.shortName],
        });
      }
    }
  };
  addPositions(getCareer(), "/#work");
  addPositions(getEducation(), "/#education");

  // A tool can sit in two subcategories; list it once.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.group}|${entry.title}|${entry.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
