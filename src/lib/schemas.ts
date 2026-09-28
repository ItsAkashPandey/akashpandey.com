import { ICON_NAMES } from "@/lib/icon-names";
import { z } from "zod";

export const ContactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .min(2, { message: "Must be at least 2 characters." })
    .max(80, { message: "Name must be 80 characters or fewer." }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is required." })
    .email("Invalid email.")
    .max(160, { message: "Email must be 160 characters or fewer." }),
  message: z
    .string()
    .trim()
    .min(1, { message: "Message is required." })
    .max(3000, { message: "Message must be 3000 characters or fewer." }),
});

const iconLink = z.object({
  name: z.string().min(1),
  href: z.string().url(),
  icon: z.enum(ICON_NAMES),
});
export type IconLink = z.infer<typeof iconLink>;

/** Lowercase words joined by hyphens: the permanent part of a URL. */
const slug = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slugs use lowercase letters, numbers and single hyphens.",
  );

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dates are written YYYY-MM-DD.");

export const ACTIVITY_CATEGORIES = ["academic", "startup"] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

/**
 * An event other people came to, or fieldwork (a site visit, an
 * installation, a survey). Only the structured data differs: fieldwork is
 * marked up as an article, since search engines treat events as things to
 * attend.
 */
export const ACTIVITY_KINDS = ["event", "fieldwork"] as const;

const activity = z.object({
  /** Never change a published slug: it is the activity's permanent URL. */
  slug,
  name: z.string().min(1),
  category: z.enum(ACTIVITY_CATEGORIES),
  kind: z.enum(ACTIVITY_KINDS).default("event"),
  date: isoDate,
  /** Shown to visitors. The map uses `place` instead of parsing this. */
  location: z.string().min(1),
  /** A key in places.json. */
  place: z.string().min(1),
  description: z.string().min(1),
  /** A folder under public/ whose images are listed in file-name order. */
  imageFolder: z.string().optional(),
  links: z.array(iconLink),
});
export const activitySchema = z.object({ activities: z.array(activity) });
export type Activity = z.infer<typeof activity>;

const experiencePosition = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  description: z.array(z.string()).optional(),
  links: z.array(iconLink).optional(),
});
export type ExperiencePosition = z.infer<typeof experiencePosition>;

const experience = z.object({
  name: z.string(),
  /** How the organisation is named in running text, e.g. "IIT Roorkee". */
  shortName: z.string().min(1),
  href: z.string(),
  logo: z.string().optional(),
  logos: z.array(z.string()).optional(),
  /** A key in places.json, or null for a site that is deliberately unmapped. */
  place: z.string().nullable(),
  positions: z.array(experiencePosition).min(1),
});
export type Experience = z.infer<typeof experience>;

export const careerSchema = z.object({ career: z.array(experience) });
export const educationSchema = z.object({ education: z.array(experience) });
export const socialSchema = z.object({ socials: z.array(iconLink) });

export const placesSchema = z.record(
  z.string(),
  z.object({
    name: z.string().min(1),
    /** Places in one city share a stop on the home page globe. */
    city: z.string().min(1),
    country: z.string().default("India"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
);
export type Place = z.infer<typeof placesSchema>[string];

const publicationMedia = z.object({
  label: z.string(),
  image: z.string(),
  fullImage: z.string().optional(),
  alt: z.string(),
});
export type PublicationMedia = z.infer<typeof publicationMedia>;

export const PUBLICATION_TYPES = [
  "Journal",
  "Conference",
  "Book",
  "Book Chapter",
  "Manuscript",
] as const;
export const PUBLICATION_STATUSES = [
  "Published",
  "Accepted",
  "Under Review",
  "In Preparation",
] as const;

const publication = z.object({
  id: z.number().int(),
  /** Never change a published slug: it is the paper's permanent URL. */
  slug,
  title: z.string().min(1),
  authors: z.string().min(1),
  year: z.number().int(),
  type: z.enum(PUBLICATION_TYPES),
  journal: z.string().optional(),
  journalLogo: z.string().optional(),
  journalQuartile: z.string().optional(),
  impactFactor: z.number().optional(),
  conference: z.string().optional(),
  conferenceLogo: z.string().optional(),
  book: z.string().optional(),
  publisher: z.string().optional(),
  publisherLogo: z.string().optional(),
  volume: z.number().optional(),
  article: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().url().optional(),
  preprint: z.string().url().optional(),
  media: z.array(publicationMedia).optional(),
  status: z.enum(PUBLICATION_STATUSES),
});
export const publicationsSchema = z.object({
  publications: z.array(publication),
});
export type Publication = z.infer<typeof publication>;

const skillTool = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  model: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  experience: z.string().min(1),
  tasks: z.array(z.string()).min(1),
  invertDark: z.boolean().optional(),
  invertLight: z.boolean().optional(),
  gradient: z.string().optional(),
  popupImages: z.array(z.string()).optional(),
});
export type SkillTool = z.infer<typeof skillTool>;

const skillCategory = z.object({
  id: z.number().int(),
  mainCategory: z.string().min(1),
  description: z.string().min(1),
  images: z.array(z.string()).optional(),
  subcategories: z.array(
    z.object({ name: z.string().min(1), tools: z.array(skillTool).min(1) }),
  ),
});
export const skillsSchema = z.object({ skills: z.array(skillCategory) });
export type SkillCategory = z.infer<typeof skillCategory>;
