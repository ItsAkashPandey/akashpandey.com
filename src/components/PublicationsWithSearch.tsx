"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Hourglass,
  Presentation,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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
import { HighlightText } from "@/components/HighlightedText";
import ImageLightbox from "@/components/ImageLightbox";
import StackedImageDeck from "@/components/StackedImageDeck";
import { cn } from "@/lib/utils";

interface PublicationMedia {
  label: string;
  image: string;
  fullImage?: string;
  alt: string;
}

interface Publication {
  id: number;
  title: string;
  authors: string;
  year: number;
  type: "Journal" | "Conference" | "Book" | "Book Chapter" | "Manuscript";
  journal?: string;
  journalLogo?: string;
  journalQuartile?: string;
  impactFactor?: number;
  conference?: string;
  conferenceLogo?: string;
  book?: string;
  publisher?: string;
  publisherLogo?: string;
  volume?: number;
  article?: string;
  pages?: string;
  doi?: string;
  preprint?: string;
  media?: PublicationMedia[];
  status: "Published" | "Accepted" | "Under Review" | "In Preparation";
}

interface Props {
  publications: Publication[];
}

type SortOption = "newest" | "oldest" | "title";
type PublicationTypeFilter = "all" | Publication["type"];

const publicationTypeLabels: Record<Publication["type"], string> = {
  Journal: "Journals",
  Conference: "Conferences",
  Book: "Books",
  "Book Chapter": "Book Chapter",
  Manuscript: "Manuscripts",
};

const typeStyles = {
  Journal: {
    label: "Journal",
    Icon: FileText,
    rail: "bg-emerald-500",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  Conference: {
    label: "Conference",
    Icon: Presentation,
    rail: "bg-sky-500",
    chip: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200",
    soft: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  Book: {
    label: "Book",
    Icon: BookOpen,
    rail: "bg-amber-500",
    chip: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
    soft: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  "Book Chapter": {
    label: "Book Chapter",
    Icon: BookMarked,
    rail: "bg-orange-500",
    chip: "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-200",
    soft: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
  Manuscript: {
    label: "Manuscript",
    Icon: ClipboardList,
    rail: "bg-violet-500",
    chip: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200",
    soft: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
} satisfies Record<
  Publication["type"],
  {
    label: string;
    Icon: typeof FileText;
    rail: string;
    chip: string;
    soft: string;
  }
>;

const statusStyles = {
  Published: {
    Icon: CheckCircle2,
    className: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Accepted: {
    Icon: CheckCircle2,
    className: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  "Under Review": {
    Icon: Clock3,
    className: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  "In Preparation": {
    Icon: Hourglass,
    className: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
} satisfies Record<
  Publication["status"],
  { Icon: typeof CheckCircle2; className: string; dot: string }
>;

export default function PublicationsWithSearch({ publications }: Props) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedType, setSelectedType] =
    useState<PublicationTypeFilter>("all");
  const normalizedQuery = query.trim();

  const years = useMemo(() => {
    return Array.from(new Set(publications.map((pub) => pub.year))).sort(
      (a, b) => b - a,
    );
  }, [publications]);

  const publicationTypes = useMemo(() => {
    const typeOrder: Publication["type"][] = [
      "Journal",
      "Conference",
      "Book Chapter",
      "Book",
      "Manuscript",
    ];
    const availableTypes = new Set(publications.map((pub) => pub.type));
    return typeOrder.filter((type) => availableTypes.has(type));
  }, [publications]);

  const filtered = useMemo(() => {
    return publications
      .filter((pub) => {
        const venue =
          pub.journal || pub.conference || pub.book || pub.publisher || "";
        const haystack = [
          pub.title,
          pub.authors,
          venue,
          pub.type,
          pub.status,
          pub.year,
        ]
          .join(" ")
          .toLowerCase();

        if (
          normalizedQuery &&
          !haystack.includes(normalizedQuery.toLowerCase())
        ) {
          return false;
        }
        if (selectedYear !== "all" && pub.year !== parseInt(selectedYear)) {
          return false;
        }
        if (selectedType !== "all" && pub.type !== selectedType) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return b.year - a.year || a.id - b.id;
          case "oldest":
            return a.year - b.year || a.id - b.id;
          case "title":
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [publications, normalizedQuery, selectedYear, selectedType, sortBy]);

  const typeCounts = useMemo(() => {
    return publications.reduce(
      (counts, pub) => {
        counts[pub.type] = (counts[pub.type] || 0) + 1;
        return counts;
      },
      {} as Partial<Record<Publication["type"], number>>,
    );
  }, [publications]);

  const resetFilters = () => {
    setQuery("");
    setSelectedYear("all");
    setSelectedType("all");
    setSortBy("newest");
  };

  const isFiltered =
    normalizedQuery !== "" ||
    selectedYear !== "all" ||
    selectedType !== "all" ||
    sortBy !== "newest";

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-8">
      <aside className="filter-rail rounded-xl p-4 lg:sticky lg:top-24">
        <div className="border-border/50 mb-4 flex items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              <h2 className="text-sm font-semibold">Library</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
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
            <Label
              htmlFor="publication-search"
              className="text-muted-foreground px-1 text-[9px] font-semibold uppercase"
            >
              Search
            </Label>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <Search className="text-muted-foreground size-3.5" />
              </span>
              <Input
                id="publication-search"
                type="search"
                placeholder="Title, author, venue"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="border-border/60 bg-background/70 h-10 rounded-lg pl-10 text-sm shadow-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground px-1 text-[9px] font-semibold uppercase">
              Format
            </p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {publicationTypes.map((type) => {
                const config = typeStyles[type];
                const Icon = config.Icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setSelectedType((current) =>
                        current === type ? "all" : type,
                      )
                    }
                    className={cn(
                      "group flex min-w-0 items-center gap-2.5 rounded-lg border p-2 text-left transition-colors",
                      selectedType === type
                        ? "border-foreground/25 bg-foreground/[0.055] shadow-sm"
                        : "hover:border-border/70 hover:bg-muted/55 border-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        config.soft,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">
                        {publicationTypeLabels[type]}
                      </span>
                      <span className="text-muted-foreground block text-[10px]">
                        {typeCounts[type]} items
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label
                htmlFor="year-filter"
                className="text-muted-foreground px-1 text-[9px] font-semibold uppercase"
              >
                Year
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
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
              <Label
                htmlFor="sort-filter"
                className="text-muted-foreground px-1 text-[9px] font-semibold uppercase"
              >
                Order
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
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
                  <SelectItem value="title">Title A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-muted/55 text-muted-foreground rounded-xl px-6 py-16 text-center text-sm">
            No publications found matching your criteria.
          </div>
        ) : (
          filtered.map((pub, index) => (
            <PublicationCard
              key={pub.id}
              index={index}
              publication={pub}
              query={normalizedQuery}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PublicationCard({
  index,
  publication,
  query,
}: {
  index: number;
  publication: Publication;
  query: string;
}) {
  const typeConfig = typeStyles[publication.type];
  const venue =
    publication.journal ||
    publication.conference ||
    publication.book ||
    publication.publisher;
  const logo =
    publication.journalLogo ||
    publication.conferenceLogo ||
    publication.publisherLogo;
  const actionHref = publication.preprint || publication.doi;
  const actionLabel = publication.preprint ? "Open preprint" : "Open paper";
  const hasMedia = Boolean(publication.media?.length);
  const recordTone = [
    "record-surface--sage",
    "record-surface--blue",
    "record-surface--coral",
  ][index % 3];

  return (
    <article
      className={cn(
        "record-surface group relative overflow-hidden rounded-xl p-5 transition-shadow duration-200 hover:shadow-[10px_16px_42px_rgba(12,35,36,0.11)] sm:p-6",
        recordTone,
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-7 h-[3px] w-12 rounded-b-full",
          typeConfig.rail,
        )}
      />

      <header className="border-border/65 border-b pb-4">
        <h2 className="group-hover:text-primary max-w-[34ch] text-xl leading-snug font-semibold text-balance transition-colors sm:text-2xl lg:max-w-none">
          <HighlightText text={publication.title} query={query} />
        </h2>
      </header>

      <div
        className={cn(
          "grid gap-6 pt-5",
          hasMedia && "md:grid-cols-[minmax(0,1fr)_300px] md:items-start",
        )}
      >
        <div className="flex min-w-0 flex-col gap-5">
          <PublicationMetadata publication={publication} query={query} />

          <div>
            <p className="text-muted-foreground text-[9px] font-semibold uppercase">
              Authors
            </p>
            <p className="mt-2 text-sm leading-relaxed sm:text-[15px]">
              <HighlightText text={publication.authors} query={query} />
            </p>
          </div>

          {venue && (
            <div className="border-border/65 flex items-center gap-3 border-y py-4">
              {logo ? (
                <img
                  src={logo}
                  alt={venue}
                  className="bg-card size-12 shrink-0 rounded-md object-contain p-1"
                />
              ) : (
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-md",
                    typeConfig.soft,
                  )}
                >
                  <GraduationCap className="size-5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm leading-snug font-semibold">
                  <HighlightText text={venue} query={query} />
                </p>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                  {publication.impactFactor && (
                    <span>IF {publication.impactFactor}</span>
                  )}
                  {publication.journalQuartile && (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
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

          <div>
            {actionHref ? (
              <Link
                href={actionHref}
                target="_blank"
                rel="noreferrer"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-[3px_4px_0_hsl(var(--foreground)/.13)] transition-[background-color,box-shadow] hover:shadow-[2px_3px_0_hsl(var(--foreground)/.18)]"
              >
                <span>{actionLabel}</span>
                <ExternalLink className="size-4" />
              </Link>
            ) : (
              <span className="text-muted-foreground inline-flex h-10 items-center text-xs">
                Link pending
              </span>
            )}
          </div>
        </div>

        {hasMedia && publication.media && (
          <div className="min-w-0">
            <PublicationMediaPreview media={publication.media} />
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
  publication: Publication;
  query: string;
}) {
  const typeConfig = typeStyles[publication.type];
  const statusConfig = statusStyles[publication.status];
  const TypeIcon = typeConfig.Icon;
  const StatusIcon = statusConfig.Icon;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-semibold",
          typeConfig.chip,
        )}
      >
        <TypeIcon className="size-3" />
        <HighlightText text={typeConfig.label} query={query} />
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

function PublicationMediaPreview({ media }: { media: PublicationMedia[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fullImages = media.map((item) => item.fullImage || item.image);

  return (
    <>
      <div className="flex min-h-[250px] items-center justify-center overflow-visible">
        <StackedImageDeck
          images={media.map((item) => item.image)}
          labels={media.map((item) => item.label)}
          alt={media[0]?.alt ?? "Publication visual"}
          imageWidth={900}
          imageHeight={680}
          sizes="(max-width: 1024px) calc(100vw - 3rem), 300px"
          quality={88}
          idleQuality={88}
          stackSize={Math.min(3, media.length)}
          className="h-[250px] w-full max-w-[300px]"
          onImageClick={setLightboxIndex}
        />
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox
          images={fullImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
