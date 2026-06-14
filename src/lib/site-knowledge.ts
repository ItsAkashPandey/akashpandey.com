import activitiesData from "@/data/activities.json";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import publicationsData from "@/data/publications.json";
import skillsData from "@/data/skills.json";
import type { ChatAction, ChatUiCard } from "./chat-types";
import fs from "fs";
import path from "path";

export type KnowledgeDoc = {
  id: string;
  kind:
    | "profile"
    | "page"
    | "activity"
    | "publication"
    | "skill"
    | "career"
    | "education"
    | "contact";
  title: string;
  text: string;
  href?: string;
  meta?: string;
  keywords?: string[];
};

type RetrievalResult = {
  docs: KnowledgeDoc[];
  actions: ChatAction[];
  cards: ChatUiCard[];
};

let cachedDocs: KnowledgeDoc[] | null = null;
let cachedProfileText: string | null = null;

const ROUTE_DOCS: KnowledgeDoc[] = [
  {
    id: "route-home",
    kind: "page",
    title: "Home",
    href: "/",
    text: "Portfolio overview, research highlights, Bhoomicam work, recent activities, skills, publications, and contact entry points.",
    keywords: ["home", "overview", "portfolio", "akashpandey.com"],
  },
  {
    id: "route-activities",
    kind: "page",
    title: "Activities",
    href: "/activities",
    text: "Full activity timeline with conferences, startup events, workshops, fieldwork, outreach, awards, and installations.",
    keywords: ["activities", "events", "timeline", "conference", "workshop"],
  },
  {
    id: "route-publications",
    kind: "page",
    title: "Publications",
    href: "/publications",
    text: "Research publications, papers, conference abstracts, posters, DOI links, journal status, and publication media.",
    keywords: ["publications", "paper", "journal", "doi", "research", "poster"],
  },
  {
    id: "route-skills",
    kind: "page",
    title: "Skills",
    href: "/skills",
    text: "Technical skills, instruments, UAVs, GPS, sensors, software, GIS, remote sensing, photogrammetry, and programming tools.",
    keywords: ["skills", "tools", "uav", "gps", "software", "gis"],
  },
  {
    id: "route-contact",
    kind: "contact",
    title: "Contact",
    href: "/contact",
    text: "Contact Akash through the website contact form. Public contact email: akash_k@ce.iitr.ac.in.",
    keywords: ["contact", "email", "reach", "message", "connect"],
  },
];

function readProfileText() {
  if (cachedProfileText) return cachedProfileText;
  try {
    cachedProfileText = fs.readFileSync(
      path.join(process.cwd(), "src", "data", "profile.md"),
      "utf-8",
    );
  } catch {
    cachedProfileText =
      "Akash is a PhD scholar in Geospatial Engineering at IIT Roorkee.";
  }
  return cachedProfileText;
}

function cleanText(input: unknown, limit = 900) {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function getActivityDocs(): KnowledgeDoc[] {
  const activities = [...((activitiesData as any).activities ?? [])].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return activities.map((activity: any, index: number) => {
    const date = activity.date
      ? new Date(activity.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "";
    const links = Array.isArray(activity.links)
      ? activity.links
          .map((link: any) => `${link.name}: ${link.href}`)
          .filter(Boolean)
          .join("; ")
      : "";

    return {
      id: `activity-${index}`,
      kind: "activity",
      title: activity.name,
      href: `/activities#activity-${index}`,
      meta: [date, activity.location].filter(Boolean).join(" · "),
      text: cleanText(
        `${activity.name}. Date: ${date}. Location: ${activity.location ?? ""}. ${activity.description ?? ""} ${links}`,
      ),
      keywords: [
        "activity",
        "event",
        "conference",
        activity.imageFolder,
        activity.location,
      ].filter(Boolean),
    };
  });
}

function getPublicationDocs(): KnowledgeDoc[] {
  const publications = (publicationsData as any).publications ?? [];
  return publications.map((publication: any) => ({
    id: `publication-${publication.id ?? publication.title}`,
    kind: "publication",
    title: publication.title,
    href: publication.doi || publication.preprint || "/publications",
    meta: [
      publication.year,
      publication.journal || publication.conference || publication.type,
      publication.status,
    ]
      .filter(Boolean)
      .join(" · "),
    text: cleanText(
      `${publication.title}. Authors: ${publication.authors}. Year: ${publication.year}. Type: ${publication.type}. Venue: ${
        publication.journal || publication.conference || ""
      }. Status: ${publication.status ?? ""}. DOI: ${publication.doi ?? ""}. Preprint: ${
        publication.preprint ?? ""
      }.`,
    ),
    keywords: [
      "publication",
      "paper",
      "doi",
      publication.journal,
      publication.conference,
      publication.status,
      publication.type,
    ].filter(Boolean),
  }));
}

function getSkillDocs(): KnowledgeDoc[] {
  const categories = (skillsData as any).skills ?? [];
  const docs: KnowledgeDoc[] = [];

  for (const category of categories) {
    const tools = (category.subcategories ?? []).flatMap((subcategory: any) =>
      (subcategory.tools ?? []).map((tool: any) => tool.name),
    );
    docs.push({
      id: `skill-${category.id ?? category.mainCategory}`,
      kind: "skill",
      title: category.mainCategory,
      href: "/skills",
      meta: `${tools.length} tools`,
      text: cleanText(
        `${category.mainCategory}. ${category.description ?? ""} Tools: ${tools.join(", ")}.`,
      ),
      keywords: [
        "skill",
        "tools",
        "instrument",
        category.mainCategory,
        ...tools,
      ],
    });
  }

  return docs;
}

function getCareerDocs(): KnowledgeDoc[] {
  const careers = (careerData as any).career ?? [];
  return careers.flatMap((career: any) =>
    (career.positions ?? []).map((position: any, index: number) => ({
      id: `career-${career.name}-${index}`,
      kind: "career" as const,
      title: `${position.title} at ${career.name}`,
      href: "/",
      meta: `${position.start} - ${position.end || "Present"}`,
      text: cleanText(
        `${position.title} at ${career.name}, ${position.start} to ${
          position.end || "Present"
        }. ${
          Array.isArray(position.description)
            ? position.description.join("; ")
            : position.description || ""
        }`,
      ),
      keywords: ["career", "experience", "role", career.name, position.title],
    })),
  );
}

function getEducationDocs(): KnowledgeDoc[] {
  const schools = (educationData as any).education ?? [];
  return schools.flatMap((school: any) =>
    (school.positions ?? []).map((position: any, index: number) => ({
      id: `education-${school.name}-${index}`,
      kind: "education" as const,
      title: `${position.title} - ${school.name}`,
      href: "/",
      meta: `${position.start} - ${position.end || "Present"}`,
      text: cleanText(
        `${position.title} from ${school.name}, ${position.start} to ${
          position.end || "Present"
        }. ${
          Array.isArray(position.description)
            ? position.description.join("; ")
            : position.description || ""
        }`,
      ),
      keywords: ["education", "degree", "phd", "mtech", "btech", school.name],
    })),
  );
}

export function getSiteKnowledgeDocs(): KnowledgeDoc[] {
  if (cachedDocs) return cachedDocs;

  cachedDocs = [
    {
      id: "profile-core",
      kind: "profile",
      title: "Akash Profile",
      href: "/",
      text: readProfileText(),
      keywords: [
        "akash",
        "profile",
        "bio",
        "about",
        "age",
        "birthday",
        "contact",
        "phd",
      ],
    },
    ...ROUTE_DOCS,
    ...getActivityDocs(),
    ...getPublicationDocs(),
    ...getSkillDocs(),
    ...getCareerDocs(),
    ...getEducationDocs(),
  ];

  return cachedDocs;
}

function tokenize(input: string) {
  return Array.from(
    new Set(
      input
        .toLowerCase()
        .replace(/[^a-z0-9+\-. ]/g, " ")
        .split(/\s+/)
        .map((token) => {
          if (token === "activities") return "activity";
          if (token === "publications") return "publication";
          if (token === "papers") return "paper";
          if (token === "skills") return "skill";
          if (token === "events") return "event";
          if (token === "tools") return "tool";
          return token;
        })
        .filter((token) => token.length > 2),
    ),
  );
}

function detectIntentKind(query: string): KnowledgeDoc["kind"] | null {
  const lower = query.toLowerCase();
  if (
    /(activity|activities|event|conference|workshop|visit|timeline)/.test(lower)
  ) {
    return "activity";
  }
  if (/(publication|paper|journal|doi|research|poster)/.test(lower)) {
    return "publication";
  }
  if (/(skill|tool|uav|gps|software|instrument|drone|gis)/.test(lower)) {
    return "skill";
  }
  if (/(contact|email|reach|message|connect)/.test(lower)) return "contact";
  if (/(education|phd|degree|mtech|btech|iit)/.test(lower)) return "education";
  if (/(career|role|experience|bhoomicam|job|work)/.test(lower)) {
    return "career";
  }
  return null;
}

function scoreDoc(
  doc: KnowledgeDoc,
  tokens: string[],
  intentKind: KnowledgeDoc["kind"] | null,
) {
  const title = doc.title.toLowerCase();
  const text = doc.text.toLowerCase();
  const keywords = (doc.keywords ?? []).join(" ").toLowerCase();
  let score = doc.id === "profile-core" ? 1.2 : 0;

  if (intentKind && doc.kind === intentKind) score += 10;
  if (intentKind === "activity" && doc.id === "route-activities") score += 8;
  if (intentKind === "activity" && doc.id.startsWith("activity-")) {
    const index = Number(doc.id.replace("activity-", ""));
    if (Number.isFinite(index)) score += Math.max(0, 6 - index * 0.2);
  }
  if (intentKind === "publication" && doc.id === "route-publications") {
    score += 8;
  }
  if (intentKind === "skill" && doc.id === "route-skills") score += 8;
  if (intentKind === "contact" && doc.id === "route-contact") score += 8;

  for (const token of tokens) {
    if (title.includes(token)) score += 6;
    if (keywords.includes(token)) score += 4;
    if (text.includes(token)) score += 1;
  }

  return score;
}

function activityIndex(doc: KnowledgeDoc) {
  if (!doc.id.startsWith("activity-")) return Number.POSITIVE_INFINITY;
  const index = Number(doc.id.replace("activity-", ""));
  return Number.isFinite(index) ? index : Number.POSITIVE_INFINITY;
}

function uniqueActions(actions: ChatAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = action.href || action.prompt || action.label;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function actionForDoc(doc: KnowledgeDoc): ChatAction | null {
  if (!doc.href) return null;
  const external =
    /^https?:\/\//i.test(doc.href) || doc.href.startsWith("mailto:");
  return {
    label:
      doc.kind === "publication" && external
        ? "Open paper"
        : doc.kind === "contact"
          ? "Contact Akash"
          : doc.title,
    href: doc.href,
    kind: doc.href.startsWith("mailto:")
      ? "email"
      : external
        ? "external"
        : "page",
  };
}

function intentActions(query: string): ChatAction[] {
  const lower = query.toLowerCase();
  const actions: ChatAction[] = [];

  if (
    /(activity|activities|event|conference|workshop|visit|timeline)/.test(lower)
  ) {
    actions.push({
      label: "View activities",
      href: "/activities",
      kind: "page",
    });
  }
  if (/(publication|paper|journal|doi|research|poster)/.test(lower)) {
    actions.push({
      label: "View publications",
      href: "/publications",
      kind: "page",
    });
  }
  if (/(skill|tool|uav|gps|software|instrument|drone|gis)/.test(lower)) {
    actions.push({ label: "View skills", href: "/skills", kind: "page" });
  }
  if (/(contact|email|reach|message|connect)/.test(lower)) {
    actions.push({ label: "Contact Akash", href: "/contact", kind: "page" });
    actions.push({
      label: "Email Akash",
      href: "mailto:akash_k@ce.iitr.ac.in",
      kind: "email",
    });
  }

  actions.push({
    label: "Ask about recent activities",
    prompt: "What are Akash's recent activities?",
    kind: "prompt",
  });

  return actions;
}

export function retrieveSiteKnowledge(
  query: string,
  limit = 8,
): RetrievalResult {
  const tokens = tokenize(query);
  const intentKind = detectIntentKind(query);
  const wantsRecent = /(recent|latest|newest|new|current)/i.test(query);
  const docs = getSiteKnowledgeDocs()
    .map((doc) => ({ doc, score: scoreDoc(doc, tokens, intentKind) }))
    .filter(({ doc, score }) => doc.id === "profile-core" || score > 0)
    .sort((a, b) => {
      if (
        wantsRecent &&
        intentKind === "activity" &&
        a.doc.kind === "activity" &&
        b.doc.kind === "activity"
      ) {
        return activityIndex(a.doc) - activityIndex(b.doc);
      }

      return b.score - a.score;
    })
    .slice(0, limit)
    .map(({ doc }) => doc);

  const actions = uniqueActions([
    ...intentActions(query),
    ...docs.map(actionForDoc).filter(Boolean),
  ] as ChatAction[]).slice(0, 5);

  const cards = docs
    .filter((doc) => ["activity", "publication", "skill"].includes(doc.kind))
    .slice(0, 4)
    .map((doc) => ({
      title: doc.title,
      subtitle: doc.text.slice(0, 140),
      href: doc.href,
      meta: doc.meta || doc.kind,
    }));

  return { docs, actions, cards };
}

export function buildKnowledgePrompt(docs: KnowledgeDoc[]) {
  return docs
    .map((doc, index) => {
      const href = doc.href ? `\nLink: ${doc.href}` : "";
      const meta = doc.meta ? `\nMeta: ${doc.meta}` : "";
      return `[#${index + 1}] ${doc.title} (${doc.kind})${meta}${href}\n${doc.text}`;
    })
    .join("\n\n");
}
