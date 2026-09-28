import { ActivityBody, ActivityLinks } from "@/components/ActivityCard";
import PhotoGrid from "@/components/PhotoGrid";
import siteData from "@/data/site.json";
import { getActivityImages } from "@/lib/activity-images";
import { splitDescription } from "@/lib/collaborators";
import { getActivities, getActivity } from "@/lib/content";
import {
  activityHref,
  formatActivityDate,
  plainText,
  truncate,
} from "@/lib/content-utils";
import { getPhotos } from "@/lib/photos";
import { getPlace } from "@/lib/places";
import { breadcrumbSchema, jsonLdProps } from "@/lib/structured-data";
import { ArrowLeft, ArrowRight, ListFilter, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

// Every activity page is built ahead of time; an unknown slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getActivities().map((activity) => ({ slug: activity.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const activity = getActivity(slug);
  if (!activity) return {};

  const description = truncate(
    plainText(splitDescription(activity.description).body),
    158,
  );
  return {
    title: activity.name,
    description,
    alternates: { canonical: activityHref(slug) },
    openGraph: {
      type: "article",
      title: activity.name,
      description,
      url: activityHref(slug),
      publishedTime: activity.date,
    },
    twitter: { card: "summary_large_image", title: activity.name, description },
  };
}

const CATEGORY_LABEL = { academic: "Academic", startup: "Startup" } as const;

export default async function ActivityPage({ params }: Params) {
  const { slug } = await params;
  const activity = getActivity(slug);
  if (!activity) notFound();

  const activities = getActivities();
  const index = activities.findIndex((item) => item.slug === slug);
  const newer = activities[index - 1];
  const older = activities[index + 1];
  const images = getActivityImages(activity);
  // One activity's photos, so every one of them gets a blur preview.
  const photos = getPhotos(images, Infinity);
  const place = getPlace(activity.place);

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: activity.name,
    startDate: activity.date,
    description: truncate(
      plainText(splitDescription(activity.description).body),
      300,
    ),
    url: `${siteData.url}${activityHref(slug)}`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: activity.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: place.city,
        addressCountry: place.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        longitude: place.coordinates[0],
        latitude: place.coordinates[1],
      },
    },
    image: images.slice(0, 3).map((src) => `${siteData.url}${src}`),
    performer: { "@id": `${siteData.url}/#akash` },
  };

  return (
    <article className="page-shell">
      <script {...jsonLdProps(eventSchema)} />
      <script
        {...jsonLdProps(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Activities", path: "/activities" },
            { name: activity.name, path: activityHref(slug) },
          ]),
        )}
      />

      <nav aria-label="Breadcrumb" className="-mb-2">
        <Link
          href={`/activities#${slug}`}
          className="link-ink inline-flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All activities
        </Link>
      </nav>

      <header className="flex max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground text-sm font-medium">
          {CATEGORY_LABEL[activity.category]} ·{" "}
          <time dateTime={activity.date}>
            {formatActivityDate(activity.date, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
        <h1 className="font-serif text-4xl leading-[1.08] font-normal text-balance sm:text-5xl">
          {activity.name}
        </h1>
        <p className="text-muted-foreground inline-flex items-start gap-1.5 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          {activity.location}
        </p>
      </header>

      <section className="record-surface grid gap-6 rounded-lg p-5 sm:p-7">
        <ActivityBody activity={activity} />
        <ActivityLinks links={activity.links} />
      </section>

      {photos.length > 0 && (
        <section aria-labelledby="photos-heading" className="flex flex-col gap-4">
          <div className="section-heading">
            <h2 id="photos-heading" className="section-title">
              photos
            </h2>
            <span className="text-muted-foreground text-sm">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </span>
          </div>
          <PhotoGrid photos={photos} alt={activity.name} />
        </section>
      )}

      <nav
        aria-label="More activities"
        className="border-border/60 grid gap-3 border-t pt-6 sm:grid-cols-2"
      >
        {newer ? (
          <Link
            href={activityHref(newer.slug)}
            className="record-surface hover:border-ink/40 group flex flex-col gap-1 rounded-lg p-4 transition-colors"
          >
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold">
              <ArrowLeft className="size-3.5" aria-hidden /> Newer
            </span>
            <span className="group-hover:text-ink font-semibold transition-colors">
              {newer.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {older && (
          <Link
            href={activityHref(older.slug)}
            className="record-surface hover:border-ink/40 group flex flex-col items-end gap-1 rounded-lg p-4 text-right transition-colors"
          >
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold">
              Older <ArrowRight className="size-3.5" aria-hidden />
            </span>
            <span className="group-hover:text-ink font-semibold transition-colors">
              {older.name}
            </span>
          </Link>
        )}
        <Link
          href={`/activities#${slug}`}
          className="link-ink inline-flex items-center gap-1.5 text-sm font-semibold sm:col-span-2 sm:justify-self-center"
        >
          <ListFilter className="size-4" aria-hidden />
          See it in the timeline
        </Link>
      </nav>
    </article>
  );
}
