"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowUpDown,
  BookOpen,
  CalendarDays,
  ExternalLink,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
  status: "Published" | "Under Review" | "In Preparation";
}

interface Props {
  publications: Publication[];
}

type SortOption = "newest" | "oldest" | "title";

export default function PublicationsWithSearch({ publications }: Props) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  // Get unique years and venues
  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(publications.map((pub) => pub.year)),
    ).sort((a, b) => b - a);
    return uniqueYears;
  }, [publications]);

  const venues = useMemo(() => {
    const uniqueVenues = Array.from(
      new Set(
        publications
          .map(
            (pub) => pub.journal || pub.conference || pub.book || pub.publisher,
          )
          .filter(Boolean) as string[],
      ),
    ).sort();
    return uniqueVenues;
  }, [publications]);

  const filtered = useMemo(() => {
    return publications
      .filter((pub) => {
        // Search filter
        const venue =
          pub.journal || pub.conference || pub.book || pub.publisher || "";
        const haystack = [pub.title, pub.authors, venue, pub.type, pub.status]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query.toLowerCase())) {
          return false;
        }

        // Year filter
        if (selectedYear !== "all" && pub.year !== parseInt(selectedYear)) {
          return false;
        }

        // Venue filter
        if (selectedVenue !== "all" && venue !== selectedVenue) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return b.year - a.year;
          case "oldest":
            return a.year - b.year;
          case "title":
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [publications, query, selectedYear, selectedVenue, sortBy]);

  const resetFilters = () => {
    setQuery("");
    setSelectedYear("all");
    setSelectedVenue("all");
    setSortBy("newest");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-500/10 text-green-700 hover:bg-green-500/10 dark:text-green-400";
      case "Under Review":
        return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-400";
      case "In Preparation":
        return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted";
    }
  };

  // Generate a subtle shape rotation based on position
  const getShapeRotation = (index: number) => {
    return (index * 15) % 360;
  };

  const isFiltered =
    query !== "" ||
    selectedYear !== "all" ||
    selectedVenue !== "all" ||
    sortBy !== "newest";

  return (
    <div className="flex flex-col gap-12">
      <div className="border-border/50 bg-background/85 supports-[backdrop-filter]:bg-background/70 rounded-[1.75rem] border p-3 shadow-sm backdrop-blur-2xl sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search publications..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-border/60 bg-background/70 h-11 rounded-2xl pl-9 text-sm shadow-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:shrink-0">
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label
                  htmlFor="year-filter"
                  className="text-muted-foreground px-1 text-[11px] font-medium"
                >
                  Year
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger
                    className="border-border/60 bg-background/70 h-11 rounded-2xl shadow-none lg:w-[132px]"
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
                  onValueChange={(val) => setSortBy(val as SortOption)}
                >
                  <SelectTrigger
                    className="border-border/60 bg-background/70 h-11 rounded-2xl shadow-none lg:w-[150px]"
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

              <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
                <Label
                  htmlFor="venue-filter"
                  className="text-muted-foreground px-1 text-[11px] font-medium"
                >
                  Venue
                </Label>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger
                    className="border-border/60 bg-background/70 h-11 rounded-2xl shadow-none lg:w-[180px]"
                    id="venue-filter"
                  >
                    <BookOpen className="text-muted-foreground mr-2 size-4 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Venues</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue} value={venue}>
                        {venue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-col justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  disabled={!isFiltered}
                  className="text-muted-foreground hover:text-foreground h-11 rounded-2xl px-3"
                >
                  <RotateCcw className="size-4" />
                  <span className="sr-only sm:not-sr-only">Reset</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center justify-between gap-3 px-1 text-xs">
            <span>
              {filtered.length} publication{filtered.length !== 1 ? "s" : ""}{" "}
              found
            </span>
            <span className="hidden sm:inline">
              All years, newest first, all venues by default
            </span>
          </div>
        </div>
      </div>

      {/* Publications list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              No publications found matching your criteria.
            </p>
          </div>
        ) : (
          filtered.map((pub, index) => (
            <div
              key={pub.id}
              className="group border-border/50 bg-background/70 hover:border-border relative overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:p-6"
              style={{
                animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Geometric number indicator */}
              <div
                className="text-muted-foreground/60 group-hover:text-foreground absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300"
                style={{
                  border: "1px solid hsl(var(--muted-foreground) / 0.2)",
                  background: "hsl(var(--muted) / 0.35)",
                  transform: `rotate(${getShapeRotation(index) / 4}deg)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `rotate(${getShapeRotation(index) / 4}deg) scale(1.08)`;
                  e.currentTarget.style.borderColor =
                    "hsl(var(--foreground) / 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${getShapeRotation(index) / 4}deg) scale(1)`;
                  e.currentTarget.style.borderColor =
                    "hsl(var(--muted-foreground) / 0.2)";
                }}
              >
                {index + 1}
              </div>

              <div className="flex flex-col gap-4 pr-10">
                {/* Title */}
                <h2 className="group-hover:text-primary text-lg leading-tight font-semibold transition-colors">
                  {pub.title}
                </h2>

                {/* Authors */}
                <p className="text-muted-foreground text-sm">{pub.authors}</p>

                {/* Journal/Conference/Book Info - Two Column Grid */}
                {(pub.journal || pub.conference || pub.book) && (
                  <div className="border-border/30 grid grid-cols-[1fr_auto] items-start gap-4 border-t py-2">
                    {/* Left Column - Logo and Journal/Conference/Book */}
                    <div>
                      {pub.journal && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {pub.journalLogo && (
                              <img
                                src={pub.journalLogo}
                                alt={pub.journal}
                                className="h-12 w-12 rounded object-contain dark:bg-white dark:p-1"
                              />
                            )}
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold">
                                {pub.journal}
                              </p>
                              {pub.impactFactor && (
                                <p className="text-muted-foreground text-xs">
                                  IF: {pub.impactFactor}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {pub.conference && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {pub.conferenceLogo && (
                              <img
                                src={pub.conferenceLogo}
                                alt={pub.conference}
                                className="h-12 w-12 rounded object-contain dark:bg-white dark:p-1"
                              />
                            )}
                            <p className="text-sm font-semibold">
                              {pub.conference}
                            </p>
                          </div>
                        </div>
                      )}
                      {pub.book && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {pub.publisherLogo && (
                              <img
                                src={pub.publisherLogo}
                                alt={pub.publisher || ""}
                                className="h-12 w-12 rounded object-contain dark:bg-white dark:p-1"
                              />
                            )}
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold">
                                {pub.book}
                              </p>
                              {pub.publisher && (
                                <p className="text-muted-foreground text-xs">
                                  {pub.publisher}
                                </p>
                              )}
                              {pub.pages && (
                                <p className="text-muted-foreground text-xs">
                                  pp. {pub.pages}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Quartile Badge */}
                    {pub.journalQuartile && (
                      <div>
                        <Badge className="bg-green-500/10 text-xs font-semibold text-green-700 dark:text-green-400">
                          {pub.journalQuartile}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {pub.year}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(pub.status)}`}>
                    {pub.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {pub.type}
                  </Badge>
                  {pub.article && (
                    <Badge variant="outline" className="text-xs">
                      Article {pub.article}
                    </Badge>
                  )}
                </div>

                {/* DOI Link */}
                {pub.preprint && (
                  <Link
                    href={pub.preprint}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 dark:hover:text-primary/60 inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <span>View Preprint</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                )}
                {pub.doi && !pub.preprint && (
                  <Link
                    href={pub.doi}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 dark:hover:text-primary/60 inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <span>View Publication</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
