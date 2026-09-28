"use client";

import { badgeVariants } from "@/components/ui/Badge";
import { parseCollaborators, splitDescription } from "@/lib/collaborators";
import {
  activityHref,
  activityYear,
  formatActivityDate,
} from "@/lib/content-utils";
import type { Photo } from "@/lib/photo";
import { rehypeMark } from "@/lib/rehype-mark";
import type { Activity, IconLink } from "@/lib/schemas";
import { getHighlightTerms } from "@/lib/search";
import { cn } from "@/lib/utils";
import { Calendar, Linkedin, MapPin, Search, Users } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import Markdown from "react-markdown";
import ActivitySwipeCards from "./ActivitySwipeCards";
import { HighlightText, MARK_CLASS } from "./HighlightedText";
import Icon from "./Icon";

interface Props {
  activity: Activity;
  photos: Photo[];
  priorityImage?: boolean;
  searchQuery?: string;
}

export function ActivityCard({
  activity,
  photos,
  priorityImage = false,
  searchQuery = "",
}: Props) {
  const { name, date, location, links, slug } = activity;

  return (
    <article className="record-surface group relative max-w-full overflow-hidden rounded-lg p-4 transition-shadow duration-200 hover:shadow-[10px_16px_42px_hsl(var(--foreground)/0.11)] sm:p-6">
      <div className="bg-foreground/45 absolute top-0 left-8 h-[3px] w-12 rounded-b-full" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[300px_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <ActivityMeta date={date} location={location} query={searchQuery} />

          {photos.length > 0 && (
            <ActivitySwipeCards
              photos={photos}
              alt={name}
              priority={priorityImage}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl leading-snug font-bold sm:text-2xl">
            <Link
              href={activityHref(slug)}
              className="decoration-primary/30 hover:text-primary decoration-2 underline-offset-4 transition-colors hover:underline"
            >
              <HighlightText text={name} query={searchQuery} />
            </Link>
          </h2>

          <div className="bg-border h-px w-full" />

          <ActivityBody activity={activity} query={searchQuery} />
          <ActivityLinks links={links} />
        </div>
      </div>
    </article>
  );
}

export function ActivityMeta({
  date,
  location,
  query,
}: {
  date: string;
  location: string;
  query?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="bg-primary/12 text-primary inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums">
          {activityYear(date)}
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
          <Calendar className="size-3.5" aria-hidden />
          <time dateTime={date}>
            {formatActivityDate(date, { month: "short", day: "numeric" })}
          </time>
        </span>
      </div>
      <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span>
          <HighlightText text={location} query={query} />
        </span>
      </div>
    </div>
  );
}

/** The description, rendered as Markdown, and the "With" line under it. */
export function ActivityBody({
  activity,
  query = "",
}: {
  activity: Activity;
  query?: string;
}) {
  const { body, collaborators } = splitDescription(activity.description);
  const terms = getHighlightTerms(query, activity.description);

  return (
    <div className="prose text-muted-foreground dark:prose-invert max-w-full text-left font-sans text-sm leading-relaxed">
      <Markdown
        rehypePlugins={
          terms.length ? [[rehypeMark, { terms, className: MARK_CLASS }]] : []
        }
      >
        {body}
      </Markdown>

      {collaborators && (
        <div className="border-primary/10 mt-4 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
          <div className="text-primary bg-primary/8 dark:bg-primary/12 flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold">
            <Users className="size-3" aria-hidden />
            <span>With</span>
          </div>
          <CollaboratorList text={collaborators} query={query} />
        </div>
      )}
    </div>
  );
}

function CollaboratorList({ text, query }: { text: string; query: string }) {
  const collaborators = parseCollaborators(text);

  return (
    <p className="not-prose text-muted-foreground m-0 min-w-0 text-xs leading-relaxed font-medium">
      {collaborators.map((collaborator, index) => {
        const separator =
          index === 0
            ? ""
            : index === collaborators.length - 1
              ? " and "
              : ", ";

        let content;
        if (collaborator.kind === "group") {
          content = <HighlightText text={collaborator.label} query={query} />;
        } else {
          const name = (
            <HighlightText text={collaborator.label} query={query} />
          );
          content = (
            <>
              {collaborator.role && (
                <span className="font-normal">{collaborator.role} — </span>
              )}
              {collaborator.href ? (
                <a
                  href={collaborator.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={
                    collaborator.verified
                      ? `${collaborator.label} on LinkedIn`
                      : `Search LinkedIn for ${collaborator.label}`
                  }
                  className="text-foreground decoration-border hover:decoration-foreground inline-flex items-center gap-1 font-semibold underline decoration-1 underline-offset-4 transition-colors"
                >
                  {name}
                  {collaborator.verified ? (
                    <Linkedin className="text-tone-sky size-3" aria-hidden />
                  ) : (
                    <Search
                      className="text-muted-foreground size-3"
                      aria-hidden
                    />
                  )}
                </a>
              ) : (
                <span className="text-foreground font-semibold">{name}</span>
              )}
            </>
          );
        }

        return (
          <Fragment key={`${collaborator.label}-${index}`}>
            {separator}
            <span className="inline-flex items-center">{content}</span>
          </Fragment>
        );
      })}
    </p>
  );
}

export function ActivityLinks({
  links,
  className,
}: {
  links: IconLink[];
  className?: string;
}) {
  if (!links.length) return null;

  return (
    <div className={cn("flex flex-row flex-wrap items-center gap-2 pt-1", className)}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            badgeVariants(),
            "flex gap-2 px-2.5 py-1 text-xs transition-colors duration-150",
          )}
        >
          <Icon name={link.icon} className="size-3" />
          {link.name}
        </a>
      ))}
    </div>
  );
}
