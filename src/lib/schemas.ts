import dynamicIconImports from "lucide-react/dynamicIconImports";
import { z } from "zod";

export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .min(2, { message: "Must be at least 2 characters." }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email("Invalid email."),
  message: z.string().min(1, { message: "Message is required." }),
});

const iconLink = z.object({
  name: z.string(),
  href: z.string().url(),
  icon: z.custom<keyof typeof dynamicIconImports>(),
});
export type IconLink = z.infer<typeof iconLink>;

const activity = z.object({
  name: z.string(),
  description: z.string(),
  date: z.string(),
  location: z.string().optional(),
  href: z.string().url().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  imageFolder: z.string().optional(),
  resolvedImages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
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
  href: z.string(),
  logo: z.string().optional(),
  logos: z.array(z.string()).optional(),
  positions: z.array(experiencePosition).min(1),
});
export type Experience = z.infer<typeof experience>;

export const careerSchema = z.object({ career: z.array(experience) });
export const educationSchema = z.object({ education: z.array(experience) });
export const socialSchema = z.object({ socials: z.array(iconLink) });
