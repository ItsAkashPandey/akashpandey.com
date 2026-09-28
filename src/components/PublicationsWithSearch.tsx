"use client";

import {
  ChapterIcon,
  DraftIcon,
  LegendIcon,
  PlateIcon,
  PodiumIcon,
  SeriesPageIcon,
  VolumeIcon,
} from "@/components/icons/FieldIcons";
import { HighlightText } from "@/components/HighlightedText";
import ImageLightbox from "@/components/ImageLightbox";
import StackedImageDeck, { DECK_SIZE } from "@/components/StackedImageDeck";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  publicationHref,
  publicationLink,
  publicationVenue,
} from "@/lib/content-utils";
import type { Photo } from "@/lib/photo";
import type { Publication } from "@/lib/schemas";
import {
  createSearchDocument,
  normalizeSearchText,
  scoreSearchDocument,
} from "@/lib/search";
import { useUrlFilters } from "@/lib/use-url-filters";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Hourglass,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type PublicationMediaItem = {
  label: string;
  alt: string;
  photo: Photo;
  full: Photo;
};

export type PublicationListItem = Omit<Publication, "media"> & {
  media: PublicationMediaItem[];
};

type PublicationType = Publication["type"];
type SortOption = "newest" | "oldest" | "title";
type Filters = { query: string; year: string; type: string; sort: string };

const DEFAULT_FILTERS: Filters = {
  query: "",
  year: "all",
  type: "all",
  sort: "newest",
};
const FILTER_KEYS = { query: "q", year: "year", type: "type", sort: "sort" };

const TYPE_ORDER: PublicationType[] = [
  "Journal",
  "Conference",
  "Book Chapter",
  "Book",
  "Manuscript",
];

const typeStyles = {
  Journal: {
    label: "Journals",
    Icon: SeriesPageIcon,
    rail: "bg-tone-green",
    chip: "border-tone-green/35 text-tone-green",
    ink: "text-tone-green",
    surface: "record-surface--sage",
  },
  Conference: {
    label: "Conferences",
    Icon: PodiumIcon,
    rail: "bg-tone-sky",
    chip: "border-tone-sky/35 text-tone-sky",
    ink: "text-tone-sky",
    surface: "record-surface--blue",
  },
  Book: {
    label: "Books",
    Icon: VolumeIcon,
    rail: "bg-tone-teal",
    chip: "border-tone-teal/35 text-tone-teal",
    ink: "text-tone-teal",
    surface: "record-surface--coral",
  },
  "Book Chapter": {
    label: "Book chapters",
    Icon: ChapterIcon,
    rail: "bg-tone-amber",
    chip: "border-tone-amber/35 text-tone-amber",
    ink: "text-tone-amber",
    surface: "record-surface--coral",
  },
  Manuscript: {
    label: "Manuscripts",
    Icon: DraftIcon,
    rail: "bg-tone-violet",
    chip: "border-tone-violet/35 text-tone-violet",
    ink: "text-tone-violet",
    surface: "",
  },
} satisfies Record<
  PublicationType,
  {
    label: string;
    Icon: typeof SeriesPageIcon;
    rail: string;
    chip: string;
    ink: string;
    surface: string;
  }
>;

const statusStyles = {
  Published: { Icon: CheckCircle2, className: "text-tone-green" },
  Accepted: { Icon: CheckCircle2, className: "text-tone-teal" },
  "Under Review": { Icon: Clock3, className: "text-tone-sky" },
  "In Preparation": { Icon: Hourglass, className: "text-tone-amber" },
} satisfies Record<
  Publication["status"],
  { Icon: typeof CheckCircle2; className: string }
>;

export default function PublicationsWithSearch({
  publications,
}: {
  publications: PublicationListItem[];
}) {
  const years = useMemo(
    () =>
      Array.from(new Set(publications.map((pub) => pub.year))).sort(
        (a, b) => b - a,
      ),
    [publications],
  );

  const [filters, updateFilters, resetFilters] = useUrlFilters<Filters>(
    DEFAULT_FILTERS,
    FILTER_KEYS,
    (raw) => ({
      ...(raw.query ? { query: raw.query } : {}),
      ...(raw.year && years.includes(Number(raw.year))
        ? { year: raw.year }
        : {}),
      ...(raw.type && TYPE_ORDER.includes(raw.type as PublicationType)
        ? { type: raw.type }
        : {}),
      ...(raw.sort === "oldest" || raw.sort === "title"
        ? { sort: raw.sort }
        : {}),
    }),
  );
  const normalizedQuery = normalizeSearchText(filters.query);

  const publicationTypes = useMemo(() => {
    const available = new Set(publications.map((pub) => pub.type));
    return TYPE_ORDER.filter((type) => available.has(type));
  }, [publications]);

  const searchIndex = useMemo(
    () =>
      new Map(
        publications.map((pub) => [
          pub.id,
          createSearchDocument([
            { value: pub.title, weight: 6 },
            { value: pub.authors, weight: 3 },
            { value: publicationVenue(pub), weight: 3 },
            { value: pub.type, weight: 2 },
            { value: pub.status, weight: 2 },
            { value: pub.year },
          ]),
        ]),
      ),
    [publications],
  );

  const filtered = useMemo(() => {
    return publications
      .map((pub) => ({
        pub,
        score: scoreSearchDocument(
          searchIndex.get(pub.id) ?? [],
          normalizedQuery,
        ),
      }))
      .filter(({ pub, score }) => {
        if (normalizedQuery && score === 0) return false;
        if (filters.year !== "all" && pub.year !== Number(filters.year)) {
          return false;
        }
        return filters.type === "all" || pub.type === filters.type;
      })
      .sort((a, b) => {
        if (normalizedQuery && b.score !== a.score) return b.score - a.score;
        switch (filters.sort as SortOption) {
          case "oldest":
            return a.pub.year - b.pub.year || a.pub.id - b.pub.id;
          case "title":
            return a.pub.title.localeCompare(b.pub.title);
          default:
            return b.pub.year - a.pub.year || a.pub.id - b.pub.id;
        }
      })
      .map(({ pub }) => pub);
  }, [publications, normalizedQuery, searchIndex, filters]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<PublicationType | "all", number>> = {
      all: publications.length,
    };
    for (const pub of publications)
      counts[pub.type] = (counts[pub.type] ?? 0) + 1;
    return counts;
  }, [publications]);

  const isFiltered =
    normalizedQuery !== "" ||
    filters.year !== "all" ||
    filters.type !== "all" ||
    filters.sort !== "newest";

  const formatOptions: (PublicationType | "all")[] = [
    "all",
    ...publicationTypes,
  ];

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-8">
      <div
        role="search"
        aria-label="Filter publications"
        className="filter-rail rounded-lg p-4 lg:sticky lg:top-24"
      >
        <div className="border-border/50 mb-4 flex items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden />
              <h2 className="text-sm font-semibold">Library</h2>
            </div>
            <p
              className="text-muted-foreground mt-1 text-xs"
              aria-live="polite"
            >
              {filtered.length} publication{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            disabled={!isFiltered}
            className="text-muted-foreground hover:text-foreground size-9 rounded-lg"
            title="Reset filters"
          >
            <RotateCcw className="size-3.5" />
            <span className="sr-only">Reset filters</span>
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="publication-search" className="filter-label">
              Search
            </Label>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <Search
                  className="text-muted-foreground size-3.5"
                  aria-hidden
                />
              </span>
              <Input
                id="publication-search"
                type="search"
                placeholder="Title, author, venue"
                value={filters.query}
                onChange={(event) =>
                  updateFilters({ query: event.target.value })
                }
                className="border-border/60 bg-background/70 h-10 rounded-lg pl-10 text-sm shadow-none"
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="filter-label mb-2">Format</legend>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {formatOptions.map((type) => {
                const config =
                  type === "all"
                    ? {
                        label: "All formats",
                        Icon: LegendIcon,
                        ink: "text-foreground/80",
                      }
                    : typeStyles[type];
                const Icon = config.Icon;
                const selected = filters.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updateFilters({ type })}
                    className={cn(
                      "group flex min-w-0 items-center gap-2.5 rounded-lg border p-2 text-left transition-colors",
                      selected
                        ? "border-foreground/25 bg-foreground/[0.055] shadow-sm"
                        : "hover:border-border/70 hover:bg-muted/55 border-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center",
                        config.ink,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">
                        {config.label}
                      </span>
                      <span className="text-muted-foreground block text-[11px]">
                        {typeCounts[type] ?? 0} items
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="year-filter" className="filter-label">
                Year
              </Label>
              <Select
                value={filters.year}
                onValueChange={(year) => updateFilters({ year })}
              >
                <SelectTrigger
                  className="border-border/60 bg-background/70 h-10 w-full rounded-lg shadow-none"
                  id="year-filter"
                >
                  <CalendarDays className="text-muted-foreground mr-2 size-3.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="sort-filter" className="filter-label">
                Order
              </Label>
              <Select
                value={filters.sort}
                onValueChange={(sort) => updateFilters({ sort })}
              >
                <SelectTrigger
                  className="border-border/60 bg-background/70 h-10 w-full rounded-lg shadow-none"
                  id="sort-filter"
                >
                  <ArrowUpDown className="text-muted-foreground mr-2 size-3.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-muted/55 text-muted-foreground flex flex-col items-center gap-3 rounded-lg px-6 py-16 text-center text-sm">
            No publications match these filters.
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          filtered.map((pub) => (
            <PublicationCard
              key={pub.id}
              publication={pub}
              query={filters.query.trim()}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PublicationCard({
  publication,
  query,
}: {
  publication: PublicationListItem;
  query: string;
}) {
  const typeConfig = typeStyles[publication.type];
  const venue = publicationVenue(publication);
  const logo =
    publication.journalLogo ||
    publication.conferenceLogo ||
    publication.publisherLogo;
  const link = publicationLink(publication);
  const hasMedia = publication.media.length > 0;

  return (
    <article
      id={publication.slug}
      className={cn(
        "record-surface group relative scroll-mt-24 overflow-hidden rounded-lg p-4 transition-shadow duration-200 hover:shadow-[8px_12px_34px_hsl(var(--foreground)/0.1)]",
        typeConfig.surface,
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-7 h-[3px] w-12 rounded-b-full",
          typeConfig.rail,
        )}
      />

      <header className="border-border/65 border-b pb-3">
        <h2 className="text-lg leading-snug font-semibold text-balance sm:text-xl">
          <Link
            href={publicationHref(publication.slug)}
            className="hover:text-ink transition-colors"
          >
            <HighlightText text={publication.title} query={query} />
          </Link>
        </h2>
      </header>

      <div
        className={cn(
          // The venue block needs a real column; 150px truncated most journal
          // names to an ellipsis.
          "grid gap-5 pt-3 md:grid-cols-[minmax(210px,250px)_minmax(0,1fr)] md:items-start",
          hasMedia &&
            "lg:grid-cols-[minmax(210px,250px)_minmax(0,1fr)_264px] lg:items-start",
        )}
      >
        <div className="flex min-w-0 flex-col gap-3 md:pr-2">
          <PublicationMetadata publication={publication} query={query} />

          {venue && (
            <div className="flex items-start gap-2.5">
              {logo ? (
                <Image
                  src={logo}
                  alt=""
                  width={36}
                  height={36}
                  className="bg-card size-9 shrink-0 rounded-sm object-contain p-1"
                />
              ) : (
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center",
                    typeConfig.ink,
                  )}
                >
                  <PlateIcon className="size-[1.15rem]" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[13px] leading-snug font-semibold text-pretty">
                  <HighlightText text={venue} query={query} />
                </p>
                <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                  {publication.impactFactor && (
                    <span>IF {publication.impactFactor}</span>
                  )}
                  {publication.journalQuartile && (
                    <span className="text-tone-green font-semibold">
                      {publication.journalQuartile}
                    </span>
                  )}
                  {publication.pages && <span>pp. {publication.pages}</span>}
                  {publication.article && (
                    <span>Article {publication.article}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold">
              Authors
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">
              <HighlightText text={publication.authors} query={query} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {link ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/75 inline-flex h-8 items-center gap-1.5 border-b border-current text-xs font-semibold transition-colors"
              >
                <span>{link.label}</span>
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : (
              <span className="text-muted-foreground inline-flex h-8 items-center text-xs">
                Link pending
              </span>
            )}
            {publication.doi && publication.preprint && (
              <a
                href={publication.preprint}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 text-xs font-medium transition-colors"
              >
                Preprint
                <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </div>
        </div>

        {hasMedia && (
          // In one column this is the last grid cell, which stranded the figure
          // at the very bottom of the card. Below the three-column breakpoint
          // it moves up under the title instead, where a figure belongs.
          <div className="border-border/55 order-first flex min-w-0 justify-center border-b pb-4 lg:order-none lg:block lg:border-t-0 lg:border-b-0 lg:border-l lg:pt-0 lg:pl-4">
            <PublicationMediaPreview
              media={publication.media}
              title={publication.title}
            />
          </div>
        )}
      </div>
    </article>
  );
}

function PublicationMetadata({
  publication,
  query,
}: {
  publication: PublicationListItem;
  query: string;
}) {
  const typeConfig = typeStyles[publication.type];
  const statusConfig = statusStyles[publication.status];
  const TypeIcon = typeConfig.Icon;
  const StatusIcon = statusConfig.Icon;

  return (
    <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] md:flex-col md:items-start">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-semibold",
          typeConfig.chip,
        )}
      >
        <TypeIcon className="size-3" />
        <HighlightText text={publication.type} query={query} />
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium",
          statusConfig.className,
        )}
      >
        <StatusIcon className="size-3" />
        <HighlightText text={publication.status} query={query} />
      </span>
      <span className="text-muted-foreground inline-flex items-center gap-1.5 font-medium">
        <CalendarDays className="size-3" />
        <HighlightText text={publication.year} query={query} />
      </span>
    </div>
  );
}

export function PublicationMediaPreview({
  media,
  title,
}: {
  media: PublicationMediaItem[];
  title: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="flex items-center justify-center overflow-visible">
        <StackedImageDeck
          photos={media.map((item) => item.photo)}
          labels={media.map((item) => item.label)}
          alt={title}
          alts={media.map((item) => item.alt)}
          imageWidth={264}
          imageHeight={198}
          sizes="264px"
          quality={86}
          fit="cover"
          stackSize={Math.min(3, media.length)}
          className={cn(DECK_SIZE.landscape, "rounded-lg")}
          onImageClick={setLightboxIndex}
        />
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox
          photos={media.map((item) => item.full)}
          alt={title}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
