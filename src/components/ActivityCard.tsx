"use client";

import { Badge } from "@/components/ui/Badge";
import { Activity } from "@/lib/schemas";
import Link from "next/link";
import Markdown from "react-markdown";
import Icon from "./Icon";
import ActivitySwipeCards from "./ActivitySwipeCards";
import { Calendar, MapPin, Users } from "lucide-react";
import { HighlightText } from "./HighlightedText";

interface Props {
  activity: Activity;
  images?: string[];
  priorityImage?: boolean;
  searchQuery?: string;
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
  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <article className="group border-border/60 bg-card/62 hover:border-border relative max-w-full overflow-hidden rounded-[28px] border p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,23,42,0.10)] sm:p-6 dark:bg-white/[0.035] dark:shadow-[0_16px_48px_rgba(0,0,0,0.22)]">
      <div className="bg-foreground absolute top-0 left-8 h-[3px] w-12 rounded-b-full opacity-80" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[300px_1fr] sm:items-center">
        {/* Left Column — Date, Location & Photo */}
        <div className="flex flex-col items-center gap-3 sm:items-start">
          {/* Date & Location */}
          <div className="flex w-full flex-col gap-1.5">
            <div className="text-foreground inline-flex items-center gap-1.5 text-xs font-semibold">
              <Calendar className="size-3.5" />
              <time dateTime={date}>{formattedDate}</time>
            </div>
            {location && (
              <div className="text-muted-foreground/80 inline-flex items-center gap-1.5 text-xs">
                <MapPin className="size-3.5" />
                <span>
                  <HighlightText text={location} query={searchQuery} />
                </span>
              </div>
            )}
          </div>

          {/* Swipe Cards */}
          {allImages.length > 0 && (
            <ActivitySwipeCards
              images={allImages}
              priority={priorityImage}
              className="w-full max-w-[280px] sm:max-w-[300px]"
            />
          )}
        </div>

        {/* Right Column — Title, Description, Links */}
        <div className="flex min-w-0 flex-col gap-3">
          {/* Title */}
          <h2 className="group-hover:text-primary text-xl leading-snug font-bold tracking-tight transition-colors duration-200">
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
          <div className="prose text-muted-foreground dark:prose-invert max-w-full text-left font-sans text-sm leading-relaxed sm:text-justify">
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
                      <div className="text-primary/70 dark:text-primary/60 bg-primary/5 dark:bg-primary/10 flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                        <Users className="size-3" />
                        <span>With</span>
                      </div>
                      <span className="text-muted-foreground/90 text-xs font-medium italic">
                        <HighlightText
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
                <Link href={link?.href} key={idx} target="_blank">
                  <Badge className="flex gap-2 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-sm">
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
