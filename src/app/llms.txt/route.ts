import siteData from "@/data/site.json";
import { getActivities, getCareer, getEducation, getPublications } from "@/lib/content";
import {
  activityHref,
  formatActivityDate,
  publicationHref,
  publicationVenue,
} from "@/lib/content-utils";

export const dynamic = "force-static";

const SITE = siteData.url;

/**
 * /llms.txt: a plain summary of the site with links, for AI assistants and
 * search tools that read it instead of crawling every page.
 */
export function GET() {
  const roles = getCareer().flatMap((org) =>
    org.positions
      .filter((position) => position.end === "Present")
      .map((position) => `${position.title}, ${org.name}`),
  );
  const degrees = getEducation().flatMap((school) =>
    school.positions.map(
      (position) =>
        `${position.title}, ${school.name} (${position.start} – ${position.end ?? "Present"})`,
    ),
  );

  const publications = getPublications()
    .filter((publication) => publication.status !== "In Preparation")
    .map((publication) => {
      const venue = publicationVenue(publication);
      return `- [${publication.title}](${SITE}${publicationHref(publication.slug)}): ${publication.type}${
        venue ? `, ${venue}` : ""
      }, ${publication.year}. ${publication.status}.`;
    });

  const activities = getActivities().map(
    (activity) =>
      `- [${activity.name}](${SITE}${activityHref(activity.slug)}): ${formatActivityDate(
        activity.date,
        { month: "short", year: "numeric" },
      )}, ${activity.location}`,
  );

  const text = `# Dr. Akash Kumar

> Geospatial researcher at IIT Roorkee, India (PhD in Geospatial Engineering, 2026). Works on crop and vegetation phenology with PhenoCams, UAVs and satellite remote sensing, and on precision agriculture. Also goes by Akash Pandey.

## Now

${roles.map((role) => `- ${role}`).join("\n")}

## Education

${degrees.map((degree) => `- ${degree}`).join("\n")}

## Pages

- [Home](${SITE}/): overview, experience and education
- [Activities](${SITE}/activities): fieldwork, talks, workshops and startup milestones
- [Publications](${SITE}/publications): papers, conference work and book chapters
- [Skills](${SITE}/skills): software, instruments, drones and field tools
- [Contact](${SITE}/contact): contact form and a map of every place mentioned on the site
- [Resume](${SITE}/resume.pdf)

## Publications

${publications.join("\n")}

## Activities

${activities.join("\n")}
`;

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
