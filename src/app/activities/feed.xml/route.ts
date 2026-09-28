import siteData from "@/data/site.json";
import { splitDescription } from "@/lib/collaborators";
import { getActivities } from "@/lib/content";
import { activityHref, plainText, truncate } from "@/lib/content-utils";

// Built once at deploy time, like the pages it lists.
export const dynamic = "force-static";

const SITE = siteData.url;

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** An RSS feed of the activities, newest first, for feed readers. */
export function GET() {
  const activities = getActivities();
  const items = activities
    .map((activity) => {
      const url = `${SITE}${activityHref(activity.slug)}`;
      const summary = truncate(
        plainText(splitDescription(activity.description).body),
        400,
      );
      return `    <item>
      <title>${escapeXml(activity.name)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${activity.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${escapeXml(activity.category)}</category>
      <description>${escapeXml(`${activity.location}. ${summary}`)}</description>
    </item>`;
    })
    .join("\n");

  const newest = activities[0]
    ? new Date(`${activities[0].date}T12:00:00Z`).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Activities · Dr. Akash Kumar</title>
    <link>${SITE}/activities</link>
    <atom:link href="${SITE}/activities/feed.xml" rel="self" type="application/rss+xml" />
    <description>Fieldwork, talks, workshops and startup milestones from Dr. Akash Kumar, IIT Roorkee.</description>
    <language>en</language>
    <lastBuildDate>${newest}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
