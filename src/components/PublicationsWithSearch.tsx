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
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-8 lg:gap-10">
      <section className="border-border/60 bg-background/85 supports-[backdrop-filter]:bg-background/70 z-30 rounded-2xl border p-3 shadow-sm backdrop-blur-2xl sm:p-4 lg:sticky lg:top-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {filtered.length} publication{filtered.length !== 1 ? "s" : ""}{" "}
              found
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
              disabled={!isFiltered}
              className="text-muted-foreground hover:text-foreground h-10 rounded-xl px-3 sm:w-auto"
            >
              <RotateCcw className="size-4" />
              <span>Reset</span>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    "group bg-background/75 flex min-h-[78px] items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
                    selectedType === type
                      ? "border-foreground/30 ring-foreground/10 ring-2"
                      : "border-border/60 hover:border-border",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
                      config.soft,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm leading-tight font-semibold">
                      {publicationTypeLabels[type]}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {typeCounts[type]} item
                      {typeCounts[type] === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid items-end gap-3 lg:grid-cols-[minmax(280px,1fr)_140px_160px]">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label
                htmlFor="publication-search"
                className="text-muted-foreground px-1 text-[11px] font-medium"
              >
                Search
              </Label>
              <div className="relative min-w-0">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Search className="text-muted-foreground size-4" />
                </span>
                <Input
                  id="publication-search"
                  type="search"
                  placeholder="Search publications, authors, venues..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="border-border/60 bg-background/70 h-11 rounded-xl pl-11 text-sm shadow-none"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label
                htmlFor="year-filter"
                className="text-muted-foreground px-1 text-[11px] font-medium"
              >
                Year
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger
                  className="border-border/60 bg-background/70 h-11 rounded-xl shadow-none"
                  id="year-filter"
                >
                  <CalendarDays className="text-muted-foreground mr-2 size-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
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
                className="text-muted-foreground px-1 text-[11px] font-medium"
              >
                Sort
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger
                  className="border-border/60 bg-background/70 h-11 rounded-xl shadow-none"
                  id="sort-filter"
                >
                  <ArrowUpDown className="text-muted-foreground mr-2 size-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">By Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="border-border/70 bg-background/60 text-muted-foreground rounded-2xl border border-dashed px-6 py-16 text-center text-sm">
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
  const statusConfig = statusStyles[publication.status];
  const TypeIcon = typeConfig.Icon;
  const StatusIcon = statusConfig.Icon;
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

  return (
    <article
      className="group border-border/60 bg-background/80 hover:border-border relative overflow-hidden rounded-2xl border shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ animation: `slideIn 0.45s ease-out ${index * 0.06}s both` }}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1.5", typeConfig.rail)} />

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-5 p-5 pl-6 sm:p-6 sm:pl-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                typeConfig.chip,
              )}
            >
              <TypeIcon className="size-3.5" />
              <HighlightText text={typeConfig.label} query={query} />
            </span>

            <span
              className={cn(
                "bg-muted/60 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                statusConfig.className,
              )}
            >
              <span className={cn("size-1.5 rounded-full", statusConfig.dot)} />
              <StatusIcon className="size-3.5" />
              <HighlightText text={publication.status} query={query} />
            </span>

            <span className="text-muted-foreground bg-muted/50 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <CalendarDays className="size-3.5" />
              <HighlightText text={publication.year} query={query} />
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="group-hover:text-primary text-xl leading-tight font-semibold tracking-tight text-balance transition-colors sm:text-2xl">
              <HighlightText text={publication.title} query={query} />
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-[15px]">
              <HighlightText text={publication.authors} query={query} />
            </p>
          </div>

          {venue && (
            <div className="border-border/50 bg-muted/25 flex items-center gap-3 rounded-xl border p-3">
              {logo ? (
                <img
                  src={logo}
                  alt={venue}
                  className="size-12 shrink-0 rounded-lg bg-white object-contain p-1 shadow-sm"
                />
              ) : (
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg",
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
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {publication.impactFactor && (
                    <span>Impact factor {publication.impactFactor}</span>
                  )}
                  {publication.journalQuartile && (
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
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

        <aside className="border-border/50 bg-muted/25 flex flex-col justify-between gap-4 border-t p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <div className="flex items-start justify-between gap-4 lg:flex-col">
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                Output
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                typeConfig.soft,
              )}
            >
              <TypeIcon className="size-4" />
              <HighlightText text={publication.type} query={query} />
            </span>
          </div>

          <div className="flex flex-wrap gap-2 lg:flex-col">
            {actionHref ? (
              <Link
                href={actionHref}
                target="_blank"
                rel="noreferrer"
                className="bg-foreground text-background inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span>{actionLabel}</span>
                <ExternalLink className="size-4" />
              </Link>
            ) : (
              <span className="text-muted-foreground inline-flex h-10 items-center rounded-xl border border-dashed px-4 text-sm">
                Link pending
              </span>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
