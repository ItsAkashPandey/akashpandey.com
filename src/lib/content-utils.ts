import type { Publication } from "@/lib/schemas";

/**
 * Pure helpers for the content types. Kept apart from content.ts, which
 * imports the JSON data, so client components can use these without shipping
 * every data file to the browser.
 */

/** "2026" from "2026-07-16", without a timezone round trip. */
export function activityYear(date: string) {
  return date.slice(0, 4);
}

/** "Jul 16, 2026". Parsed at noon so no timezone can move the day. */
export function formatActivityDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", options);
}

/** The permanent URL of an activity. */
export function activityHref(slug: string) {
  return `/activities/${slug}`;
}

/** The permanent URL of a publication. */
export function publicationHref(slug: string) {
  return `/publications/${slug}`;
}

/**
 * The version of record wins over a preprint, so a published paper always
 * opens at the publisher.
 */
export function publicationLink(
  publication: Pick<Publication, "doi" | "preprint">,
) {
  if (publication.doi) return { href: publication.doi, label: "Open paper" };
  if (publication.preprint) {
    return { href: publication.preprint, label: "Open preprint" };
  }
  return null;
}

export function publicationVenue(
  publication: Pick<Publication, "journal" | "conference" | "book" | "publisher">,
) {
  return (
    publication.journal ||
    publication.conference ||
    publication.book ||
    publication.publisher ||
    ""
  );
}

/** The anchor a tool gets on the skills page. */
export function toolSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "A, B, and C" -> ["A", "B", "C"]. */
export function splitAuthors(authors: string) {
  return authors
    .split(/,\s*(?:and\s+)?|\s+and\s+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Markdown to one line of plain text, for meta descriptions and previews. */
export function plainText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts text at a word boundary and adds an ellipsis when it was longer. */
export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}
