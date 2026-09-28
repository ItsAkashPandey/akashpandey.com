import { splitDescription } from "@/lib/collaborators";
import {
  getActivities,
  getActivity,
  getCareer,
  getEducation,
  getPublication,
  getPublications,
  getSkills,
} from "@/lib/content";
import {
  activityHref,
  formatActivityDate,
  plainText,
  publicationHref,
  publicationLink,
  publicationVenue,
  toolSlug,
  truncate,
} from "@/lib/content-utils";
import type { ChatUiCard } from "@/lib/chat-types";
import { getPlace } from "@/lib/places";
import type { Activity, Experience } from "@/lib/schemas";
import fs from "node:fs";
import path from "node:path";

/**
 * Everything Kasi is told about Akash. The profile file is sent whole, and the
 * facts that also live on the site (roles, degrees, papers, skills,
 * activities) are generated from the same JSON the pages render, so the two
 * can no longer disagree.
 */

const BIRTH_DATE = "1998-04-30";

let profileText: string | null = null;

export function getProfileText() {
  if (profileText === null) {
    try {
      profileText = fs
        .readFileSync(path.join(process.cwd(), "src", "data", "profile.md"), "utf-8")
        .trim();
    } catch {
      profileText =
        "Dr. Akash Kumar is a geospatial researcher at IIT Roorkee.";
    }
  }
  // Optional notes kept out of the public repository (Vercel env variable).
  const privateNotes = process.env.KASI_PRIVATE_NOTES?.trim();
  return privateNotes
    ? `${profileText}\n\n## Private notes (only when asked)\n\n${privateNotes}`
    : profileText;
}

export function ageOn(today: Date, birthDate = BIRTH_DATE) {
  const [year, month, day] = birthDate.split("-").map(Number);
  let age = today.getUTCFullYear() - year;
  const beforeBirthday =
    today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

function positionLine(org: Experience, position: Experience["positions"][number]) {
  const details = position.description?.join(" ") ?? "";
  return `- ${position.title}, ${org.shortName} (${org.name}), ${position.start} – ${
    position.end ?? "Present"
  }.${details ? ` ${details}` : ""}`;
}

let factSheet: string | null = null;

/** The generated half of Kasi's knowledge. Built once per server instance. */
export function getFactSheet() {
  if (factSheet) return factSheet;

  const career = getCareer();
  const current = career.flatMap((org) =>
    org.positions
      .filter((position) => position.end === "Present")
      .map((position) => positionLine(org, position)),
  );
  const earlier = career.flatMap((org) =>
    org.positions
      .filter((position) => position.end !== "Present")
      .map((position) => positionLine(org, position)),
  );
  const education = getEducation().flatMap((school) =>
    school.positions.map((position) => positionLine(school, position)),
  );

  const publications = getPublications().map((publication) => {
    const link = publicationLink(publication);
    const quality = [
      publication.journalQuartile,
      publication.impactFactor ? `IF ${publication.impactFactor}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    return `- ${publication.year} · ${publication.type} · ${publication.status} · ${
      publicationVenue(publication) || "no venue yet"
    }${quality ? ` (${quality})` : ""}: "${publication.title}". Authors: ${
      publication.authors
    }. Page: ${publicationHref(publication.slug)}${link ? `. ${link.label}: ${link.href}` : ""}`;
  });

  const skills = getSkills().flatMap((category) => [
    `Group: ${category.mainCategory === "instrument handling" ? "Field instruments" : "Software"}`,
    ...category.subcategories.map(
      (subcategory) =>
        `- ${subcategory.name}: ${subcategory.tools
          .map(
            (tool) =>
              `${tool.name}${tool.model && tool.model !== tool.name ? ` (${tool.model})` : ""} [${`/skills#${toolSlug(
                tool.name,
              )}`}] — used for ${tool.tasks.join(", ")}. In Akash's words: "${tool.experience}"`,
          )
          .join(" | ")}`,
    ),
  ]);

  const activities = getActivities().map(
    (activity) =>
      `- ${activity.date} · ${activity.name} · ${activity.location} · ${
        activity.category
      } · ${activityHref(activity.slug)}`,
  );

  factSheet = [
    "## Current roles",
    ...current,
    "",
    "## Earlier roles",
    ...earlier,
    "",
    "## Education",
    ...education,
    "",
    "## Publications (every one; a page for each)",
    ...publications,
    "",
    "## Skills, instruments and software (skills page: /skills)",
    ...skills,
    "",
    "## Activities, newest first (a page for each)",
    ...activities,
  ].join("\n");
  return factSheet;
}

// Retrieval: which activities get their full description in the prompt.

const STOP_WORDS = new Set(
  (
    "a about above after again all also am an and any are as at be because been before being " +
    "between both but by can could did do does doing done during each few for from further " +
    "get got had has have having he her here hers him his how i if in into is it its just " +
    "know like me more most my no nor not now of off on once only or other our out over own " +
    "please same she should so some such tell than that the their them then there these they " +
    "this those through to too under until up very was we were what when where which while who " +
    "whom why will with would you your akash kasi pandey kumar his him he mr dr prof " +
    "show list give any anything something everything thing things did done ever"
  ).split(" "),
);

/** A few words visitors use for things the data names differently. */
const SYNONYMS: Record<string, string[]> = {
  drone: ["uav", "trinity", "ideaforge", "spray"],
  uav: ["drone"],
  gps: ["gnss", "trimble", "emlid", "sokkia"],
  gnss: ["gps"],
  award: ["prize", "winner", "won", "awarded", "grant"],
  prize: ["award", "winner"],
  won: ["winner", "prize", "award"],
  talk: ["lecture", "presented", "presentation"],
  conference: ["conclave", "summit", "assembly", "symposium"],
  camera: ["phenocam"],
  farmer: ["farmers", "outreach", "kvk"],
  startup: ["bhoomicam"],
};

function words(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9+]+/)
    .filter((word) => word.length > 2 || /^\d+$/.test(word))
    .map((word) =>
      word.length > 4 && word.endsWith("s") && !word.endsWith("ss")
        ? word.slice(0, -1)
        : word,
    );
}

function queryTerms(text: string) {
  const terms = new Set<string>();
  for (const word of words(text)) {
    if (STOP_WORDS.has(word)) continue;
    terms.add(word);
    for (const synonym of SYNONYMS[word] ?? []) terms.add(synonym);
  }
  return terms;
}

type IndexedActivity = {
  activity: Activity;
  name: Set<string>;
  place: Set<string>;
  body: Set<string>;
};

let activityIndex: IndexedActivity[] | null = null;

function getActivityIndex() {
  activityIndex ??= getActivities().map((activity) => ({
    activity,
    name: new Set(words(activity.name)),
    place: new Set(words(`${activity.location} ${getPlace(activity.place).name}`)),
    body: new Set(words(activity.description)),
  }));
  return activityIndex;
}

/**
 * The activities most relevant to the conversation. Scores whole words (the
 * old substring match found "and" in "Grand Challenge"), and includes the
 * previous question so a follow-up like "and the second one?" still works.
 */
export function findRelevantActivities(
  message: string,
  previousQuestion = "",
  limit = 6,
) {
  const terms = queryTerms(`${message} ${previousQuestion}`);
  const years = new Set(message.match(/\b20\d{2}\b/g) ?? []);
  const wantsRecent = /\b(recent|recently|latest|newest|last|current|now)\b/i.test(message);

  const scored = getActivityIndex().map((entry, index) => {
    let score = 0;
    for (const term of terms) {
      if (entry.name.has(term)) score += 4;
      if (entry.place.has(term)) score += 2;
      if (entry.body.has(term)) score += 1;
    }
    if (years.has(entry.activity.date.slice(0, 4))) score += 3;
    if (wantsRecent && index < 4) score += 5 - index;
    return { activity: entry.activity, score };
  });

  return scored
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.activity);
}

function activityDetails(activity: Activity) {
  const { body, collaborators } = splitDescription(activity.description);
  return [
    `### ${activity.name} (${activityHref(activity.slug)})`,
    `${formatActivityDate(activity.date)} · ${activity.location} · ${activity.category}`,
    plainText(body),
    collaborators ? `With: ${collaborators}` : "",
    activity.links.length
      ? `Links: ${activity.links.map((link) => `${link.name} ${link.href}`).join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The whole <facts> block for one question. */
export function buildKnowledge(
  message: string,
  previousQuestion: string,
  today: Date,
) {
  const relevant = findRelevantActivities(message, previousQuestion);
  return {
    relevant,
    // The same for every question.
    facts: ["# Profile", getProfileText(), "", "# From the website's data", getFactSheet()].join(
      "\n",
    ),
    // Changes from question to question.
    context: [
      `Today is ${today.toISOString().slice(0, 10)}. Akash is ${ageOn(today)} years old.`,
      ...(relevant.length
        ? [
            "",
            "# Details of the activities most relevant to this question",
            ...relevant.map(activityDetails),
          ]
        : []),
    ].join("\n"),
  };
}

/**
 * Cards for the activities and papers the reply actually links to, rather
 * than for whatever a keyword list guessed the question was about.
 */
export function cardsForReply(reply: string): ChatUiCard[] {
  const cards: ChatUiCard[] = [];
  const seen = new Set<string>();

  for (const [, href] of reply.matchAll(/\]\((\/(?:activities|publications)\/[a-z0-9-]+)\)/g)) {
    if (seen.has(href) || cards.length >= 2) continue;
    seen.add(href);
    const slug = href.split("/").pop()!;

    if (href.startsWith("/activities/")) {
      const activity = getActivity(slug);
      if (!activity) continue;
      cards.push({
        title: activity.name,
        href,
        meta: `${formatActivityDate(activity.date, { month: "short", year: "numeric" })} · ${
          getPlace(activity.place).name
        }`,
        subtitle: truncate(plainText(splitDescription(activity.description).body), 140),
      });
    } else {
      const publication = getPublication(slug);
      if (!publication) continue;
      cards.push({
        title: publication.title,
        href,
        meta: [publication.year, publicationVenue(publication), publication.status]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }
  return cards;
}
