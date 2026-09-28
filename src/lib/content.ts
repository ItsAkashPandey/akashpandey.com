import activitiesData from "@/data/activities.json";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import publicationsData from "@/data/publications.json";
import skillsData from "@/data/skills.json";
import { getPlace } from "@/lib/places";
import {
  activitySchema,
  careerSchema,
  educationSchema,
  publicationsSchema,
  skillsSchema,
  type Activity,
  type Experience,
  type Publication,
  type SkillCategory,
} from "@/lib/schemas";

/**
 * The one place the JSON content is parsed. Every page, the map and Kasi read
 * through here, so a broken record fails the build with a message that names
 * it, rather than rendering a page with a hole in it. Server-side only: the
 * pure helpers client components need live in content-utils.ts.
 */

function assertUniqueSlugs(kind: string, items: { slug: string }[]) {
  const seen = new Set<string>();
  for (const { slug } of items) {
    if (seen.has(slug)) throw new Error(`Duplicate ${kind} slug "${slug}".`);
    seen.add(slug);
  }
}

/** ISO dates sort as strings, which avoids the UTC shift `new Date()` adds. */
function newestFirst(a: { date: string }, b: { date: string }) {
  return b.date.localeCompare(a.date);
}

let activities: Activity[] | null = null;

/** All activities, newest first. */
export function getActivities(): Activity[] {
  if (activities) return activities;
  const parsed = activitySchema.parse(activitiesData).activities;
  assertUniqueSlugs("activity", parsed);
  for (const activity of parsed) getPlace(activity.place);
  activities = [...parsed].sort(newestFirst);
  return activities;
}

export function getActivity(slug: string): Activity | undefined {
  return getActivities().find((activity) => activity.slug === slug);
}

let publications: Publication[] | null = null;

/** All publications in the order the JSON lists them. */
export function getPublications(): Publication[] {
  if (publications) return publications;
  const parsed = publicationsSchema.parse(publicationsData).publications;
  assertUniqueSlugs("publication", parsed);
  publications = parsed;
  return publications;
}

export function getPublication(slug: string): Publication | undefined {
  return getPublications().find((publication) => publication.slug === slug);
}

function validateOrgs(orgs: Experience[]) {
  for (const org of orgs) if (org.place) getPlace(org.place);
  return orgs;
}

let career: Experience[] | null = null;
export function getCareer(): Experience[] {
  career ??= validateOrgs(careerSchema.parse(careerData).career);
  return career;
}

let education: Experience[] | null = null;
export function getEducation(): Experience[] {
  education ??= validateOrgs(educationSchema.parse(educationData).education);
  return education;
}

let skills: SkillCategory[] | null = null;
export function getSkills(): SkillCategory[] {
  skills ??= skillsSchema.parse(skillsData).skills;
  return skills;
}

export function getAllTools() {
  return getSkills().flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.tools),
  );
}
