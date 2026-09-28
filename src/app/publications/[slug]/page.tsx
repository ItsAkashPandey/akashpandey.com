import { PublicationMediaPreview } from "@/components/PublicationsWithSearch";
import { getPublication, getPublications } from "@/lib/content";
import {
  publicationHref,
  publicationLink,
  publicationVenue,
  splitAuthors,
} from "@/lib/content-utils";
import { toPublicationListItem } from "@/lib/publication-items";
import type { Publication } from "@/lib/schemas";
import {
  breadcrumbSchema,
  jsonLdProps,
  publicationSchema,
} from "@/lib/structured-data";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublications().map((publication) => ({ slug: publication.slug }));
}

function summary(publication: Publication) {
  const venue = publicationVenue(publication);
  return `${publication.type} by ${publication.authors}${
    venue ? `, ${venue}` : ""
  }, ${publication.year}. ${publication.status}.`;
}

/**
 * Highwire tags, which Google Scholar reads to list a paper and link this
 * page as a version of it. Only for work that is out or accepted.
 */
function scholarTags(
  publication: Publication,
): Record<string, string | string[]> {
  if (publication.status !== "Published" && publication.status !== "Accepted") {
    return {};
  }
  const [firstPage, lastPage] = (publication.pages ?? "").split(/[-–]/);
  const tags: Record<string, string | string[]> = {
    citation_title: publication.title,
    citation_author: splitAuthors(publication.authors),
    citation_publication_date: String(publication.year),
  };
  if (publication.journal) tags.citation_journal_title = publication.journal;
  if (publication.conference)
    tags.citation_conference_title = publication.conference;
  if (publication.book) tags.citation_inbook_title = publication.book;
  if (publication.publisher) tags.citation_publisher = publication.publisher;
  if (publication.volume) tags.citation_volume = String(publication.volume);
  if (firstPage) tags.citation_firstpage = firstPage.trim();
  if (lastPage) tags.citation_lastpage = lastPage.trim();
  if (publication.doi) {
    tags.citation_doi = publication.doi.replace(
      /^https?:\/\/(dx\.)?doi\.org\//,
      "",
    );
  }
  return tags;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const publication = getPublication(slug);
  if (!publication) return {};
  return {
    title: publication.title,
    description: summary(publication),
    alternates: { canonical: publicationHref(slug) },
    // Drafts get a page for linking, but stay out of search results.
    ...(publication.status === "In Preparation"
      ? { robots: { index: false, follow: true } }
      : {}),
    openGraph: {
      type: "article",
      title: publication.title,
      description: summary(publication),
      url: publicationHref(slug),
    },
    other: scholarTags(publication),
  };
}

/** A plain reference in the usual order: authors (year). Title. Venue. DOI. */
function citation(publication: Publication) {
  const venue = publicationVenue(publication);
  const locator = [
    publication.volume ? `${publication.volume}` : "",
    publication.article ? `${publication.article}` : "",
    publication.pages ? `pp. ${publication.pages}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return [
    `${publication.authors} (${publication.year}).`,
    `${publication.title}.`,
    venue ? `${venue}${locator ? `, ${locator}` : ""}.` : "",
    publication.doi ?? publication.preprint ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default async function PublicationPage({ params }: Params) {
  const { slug } = await params;
  const publication = getPublication(slug);
  if (!publication) notFound();

  const item = toPublicationListItem(publication);
  const link = publicationLink(publication);
  const venue = publicationVenue(publication);

  return (
    <article className="page-shell">
      <script
        {...jsonLdProps({
          "@context": "https://schema.org",
          ...publicationSchema(publication),
        })}
      />
      <script
        {...jsonLdProps(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Publications", path: "/publications" },
            { name: publication.title, path: publicationHref(slug) },
          ]),
        )}
      />

      <nav aria-label="Breadcrumb" className="-mb-2">
        <Link
          href={`/publications#${slug}`}
          className="link-ink inline-flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All publications
        </Link>
      </nav>

      <header className="flex max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground text-sm font-medium">
          {publication.type} · {publication.year} · {publication.status}
        </p>
        <h1 className="font-serif text-3xl leading-[1.1] font-normal text-balance sm:text-4xl">
          {publication.title}
        </h1>
        <p className="text-base leading-relaxed">{publication.authors}</p>
        {venue && (
          <p className="text-muted-foreground text-sm">
            {venue}
            {publication.journalQuartile
              ? ` · ${publication.journalQuartile}`
              : ""}
            {publication.impactFactor
              ? ` · IF ${publication.impactFactor}`
              : ""}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-ink inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
            >
              {link.label}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
          {publication.doi && publication.preprint && (
            <a
              href={publication.preprint}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
            >
              Preprint
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      </header>

      {item.media.length > 0 && (
        <section
          aria-label="Figures"
          className="record-surface flex justify-center rounded-lg p-6"
        >
          <PublicationMediaPreview
            media={item.media}
            title={publication.title}
          />
        </section>
      )}

      <section aria-labelledby="cite-heading" className="flex flex-col gap-3">
        <h2 id="cite-heading" className="section-title">
          cite
        </h2>
        <p className="record-surface rounded-lg p-4 font-mono text-sm leading-relaxed break-words select-all">
          {citation(publication)}
        </p>
      </section>
    </article>
  );
}
