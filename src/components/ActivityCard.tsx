"use client";

import { Badge } from "@/components/ui/Badge";
import { Activity } from "@/lib/schemas";
import Link from "next/link";
import Markdown from "react-markdown";
import Icon from "./Icon";
import ActivitySwipeCards from "./ActivitySwipeCards";
import { Calendar, Linkedin, MapPin, Users } from "lucide-react";
import { HighlightText } from "./HighlightedText";

interface Props {
  activity: Activity;
  images?: string[];
  priorityImage?: boolean;
  searchQuery?: string;
}

const verifiedLinkedInProfiles: Record<string, string> = {
  "prof. idhayachandhiran ilampooranan": "https://www.linkedin.com/in/idhaya/",
  "idhayachandhiran ilampooranan": "https://www.linkedin.com/in/idhaya/",
  "mukund narayanan": "https://www.linkedin.com/in/mukund-narayanan-0b63a310b/",
  "prof. siddhartha khare":
    "https://www.linkedin.com/in/siddhartha-khare-503a4429/",
  "siddhartha khare": "https://www.linkedin.com/in/siddhartha-khare-503a4429/",
  "prof. saurabh vijay":
    "https://www.linkedin.com/in/saurabh-vijay-phd-b93a1429/",
  "saurabh vijay": "https://www.linkedin.com/in/saurabh-vijay-phd-b93a1429/",
  "tushar bharadwaj": "https://www.linkedin.com/in/tusharbharadwaj/",
  "shreyas goswami": "https://www.linkedin.com/in/goswami-shreyas/",
  "apurwa chaurasia": "https://www.linkedin.com/in/apurwa-chaurasia-6a9969b1/",
  "peeyush jasaiwal": "https://www.linkedin.com/in/peeyush-jasaiwal/",
  "amarjeet kumar mahato":
    "https://www.linkedin.com/in/amarjeet-kumar-mahato-630619160/",
  "gaurav singh bareth": "https://www.linkedin.com/in/g2306/",
  "ishfaqul haque": "https://www.linkedin.com/in/ishfaqul-haque-a24a61251/",
  "isfaqul haque": "https://www.linkedin.com/in/ishfaqul-haque-a24a61251/",
  "nitin lodhi": "https://www.linkedin.com/in/nitin-lodhi-215b72260/",
  "prashant singh": "https://www.linkedin.com/in/prashant-singh-356409b1/",
  "sahil kundal": "https://www.linkedin.com/in/skundal1/",
  "sushmit srivastava":
    "https://www.linkedin.com/in/sushmit-srivastava-598403206/",
  "akash a": "https://www.linkedin.com/in/akash-anilraj/",
  "suyash khare": "https://www.linkedin.com/in/suyash-khare-6450341b6/",
  "geospatial engineering group, iitr":
    "https://www.linkedin.com/company/geospatial-engineering-group-indian-institute-of-technology-roorkee/posts/?feedView=all",
  "geospatial engineering group":
    "https://www.linkedin.com/company/geospatial-engineering-group-indian-institute-of-technology-roorkee/posts/?feedView=all",
  "prof. vivek malik": "https://www.linkedin.com/in/vivek-malik-57839415/",
  "vivek malik": "https://www.linkedin.com/in/vivek-malik-57839415/",
  "dr. neeraj pant": "https://www.linkedin.com/in/neeraj-pant-2508322b4/",
  "neeraj pant": "https://www.linkedin.com/in/neeraj-pant-2508322b4/",
  "shivani noolu": "https://www.linkedin.com/in/shivani-noolu-647a79214/",
  shivani: "https://www.linkedin.com/in/shivani-noolu-647a79214/",
};

const collaboratorsWithoutLinkedIn = new Set([
  "geetu saini",
  "mr. umesh saxena",
  "umesh saxena",
]);

function collaboratorHref(name: string) {
  const normalized = name
    .replace(/[.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (collaboratorsWithoutLinkedIn.has(normalized)) return null;

  return (
    verifiedLinkedInProfiles[normalized] ??
    `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
      `${name.replace(/[.]+$/g, "").trim()} IIT Roorkee`,
    )}`
  );
}

function CollaboratorLinks({ text, query }: { text: string; query: string }) {
  const protectedText = text.replace(
    /Geospatial Engineering Group,\s*IITR/gi,
    "Geospatial Engineering Group__IITR__",
  );

  return (
    <span className="not-prose flex flex-wrap items-center gap-x-1 gap-y-1">
      {protectedText
        .split(/(\s*,\s*|\s+and\s+|\s*&\s*)/i)
        .filter(Boolean)
        .map((part, index) => {
          if (/^\s*(,|and|&)\s*$/i.test(part)) {
            return (
              <span
                key={`${part}-${index}`}
                className="text-foreground font-semibold"
              >
                {part.trim()}
              </span>
            );
          }

          const prefixMatch = part.match(/^(\s*my supervisor\s*-\s*)/i);
          const prefix = prefixMatch?.[0] ?? "";
          const rawName = part.slice(prefix.length).trim();
          const suffix = rawName.match(/[.]+$/)?.[0] ?? "";
          const name = rawName
            .replace("__IITR__", ", IITR")
            .replace(/[.]+$/g, "")
            .trim();
          const isGroup =
            !name ||
            /(organizers|participants|colleagues|volunteering tas|team|students|officers)/i.test(
              name,
            );

          if (isGroup) {
            return (
              <span key={`${part}-${index}`}>
                <HighlightText text={part.trim()} query={query} />
              </span>
            );
          }

          const linkedInHref = collaboratorHref(name);
          if (!linkedInHref) {
            return (
              <span
                key={`${name}-${index}`}
                className="text-foreground inline-flex items-center font-semibold"
              >
                {prefix && <span>{prefix.replace("-", "—")}</span>}
                <HighlightText text={name} query={query} />
                {suffix}
              </span>
            );
          }

          return (
            <span key={`${name}-${index}`} className="inline-flex items-center">
              {prefix && <span>{prefix.replace("-", "—")}</span>}
              <a
                href={linkedInHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground decoration-border hover:decoration-foreground inline-flex items-center gap-1 font-semibold underline decoration-1 underline-offset-4 transition-colors"
              >
                <HighlightText text={name} query={query} />
                <Linkedin className="size-3 text-[#0A66C2]" aria-hidden />
              </a>
              {suffix}
            </span>
          );
        })}
    </span>
  );
}

export function ActivityCard({
  activity,
  images: resolvedImages,
  priorityImage = false,
  searchQuery = "",
}: Props) {
  const { name, href, description, date, location, image, images, links } =
    activity;

  // Use resolved images (from folder scan) if provided, otherwise fall back to data
  const allImages = resolvedImages?.length
    ? resolvedImages
    : images?.length
      ? images
      : image
        ? [image]
        : [];

  // Format date nicely
  const dateObj = new Date(`${date}T12:00:00`);
  const year = dateObj.getFullYear();

  return (
    <article className="record-surface group relative max-w-full overflow-hidden rounded-lg p-4 transition-shadow duration-200 hover:shadow-[10px_16px_42px_rgba(12,35,36,0.11)] sm:p-6">
      <div className="bg-foreground/45 absolute top-0 left-8 h-[3px] w-12 rounded-b-full" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[300px_1fr] sm:items-center">
        {/* Left Column — Date, Location & Photo */}
        <div className="flex flex-col items-center gap-3 sm:items-start">
          {/* Date & Location */}
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-primary/12 text-primary inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums">
                {year}
              </span>
              <div className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-medium">
                <Calendar className="size-3.5" />
                <time dateTime={date}>
                  {dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>
            {location && (
              <div className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
                <MapPin className="size-3.5" />
                <span>
                  <HighlightText text={location} query={searchQuery} />
                </span>
              </div>
            )}
          </div>

          {/* Swipe Cards */}
          {allImages.length > 0 && (
            <ActivitySwipeCards images={allImages} priority={priorityImage} />
          )}
        </div>

        {/* Right Column — Title, Description, Links */}
        <div className="flex min-w-0 flex-col gap-3">
          {/* Title */}
          <h2 className="group-hover:text-primary text-xl leading-snug font-bold transition-colors duration-200 sm:text-2xl">
            {href ? (
              <Link
                href={href}
                target="_blank"
                rel="noreferrer"
                className="decoration-primary/30 decoration-2 underline-offset-4 hover:underline"
              >
                <HighlightText text={name} query={searchQuery} />
              </Link>
            ) : (
              <HighlightText text={name} query={searchQuery} />
            )}
          </h2>

          {/* Accent line */}
          <div className="bg-border h-px w-full" />

          {/* Description & Collaborators */}
          <div className="prose text-muted-foreground dark:prose-invert max-w-full text-left font-sans text-sm leading-relaxed">
            {(() => {
              // Split by "With: " (allowing for newlines before it)
              const parts = description.split(/\n+\s*With:\s*/);
              const mainContent = parts[0];
              const collaborators = parts[1];

              return (
                <>
                  {searchQuery.trim() ? (
                    <HighlightedParagraphs
                      text={mainContent}
                      query={searchQuery}
                    />
                  ) : (
                    <Markdown>{mainContent}</Markdown>
                  )}
                  {collaborators && (
                    <div className="border-primary/10 mt-4 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center dark:border-white/5">
                      <div className="text-primary bg-primary/8 dark:bg-primary/12 flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase">
                        <Users className="size-3" />
                        <span>With</span>
                      </div>
                      <span className="text-muted-foreground min-w-0 text-xs font-medium">
                        <CollaboratorLinks
                          text={collaborators}
                          query={searchQuery}
                        />
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Links */}
          {links && links.length > 0 && (
            <div className="flex flex-row flex-wrap items-center gap-2 pt-1">
              {links.map((link, idx) => (
                <Link
                  href={link?.href}
                  key={idx}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Badge className="flex gap-2 px-2.5 py-1 text-[10px] transition-colors duration-150">
                    <Icon name={link.icon} className="size-3" />
                    {link.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function HighlightedParagraphs({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="mt-3 first:mt-0">
            <HighlightText text={paragraph} query={query} />
          </p>
        ))}
    </>
  );
}
