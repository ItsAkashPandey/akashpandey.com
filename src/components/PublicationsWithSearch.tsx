"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ExternalLink, Delete, ArrowUpDown } from "lucide-react";
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
  type: "Journal" | "Conference" | "Book";
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
  const [selectedJournal, setSelectedJournal] = useState<string>("all");

  // Get unique years and journals
  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(publications.map((pub) => pub.year))
    ).sort((a, b) => b - a);
    return uniqueYears;
  }, [publications]);

  const journals = useMemo(() => {
    const uniqueJournals = Array.from(
      new Set(
        publications
          .filter((pub) => pub.journal)
          .map((pub) => pub.journal as string)
      )
    ).sort();
    return uniqueJournals;
  }, [publications]);

  const filtered = useMemo(() => {
    return publications
      .filter((pub) => {
        // Search filter
        const haystack = [pub.title, pub.authors, pub.journal || ""]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query.toLowerCase())) {
          return false;
        }

        // Year filter
        if (selectedYear !== "all" && pub.year !== parseInt(selectedYear)) {
          return false;
        }

        // Journal filter
        if (selectedJournal !== "all" && pub.journal !== selectedJournal) {
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
  }, [publications, query, selectedYear, selectedJournal, sortBy]);

  const resetFilters = () => {
    setQuery("");
    setSelectedYear("all");
    setSelectedJournal("all");
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
    selectedJournal !== "all" ||
    sortBy !== "newest";

  return (
    <div className="flex flex-col gap-12">
      <div className="space-y-4">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Input
            type="text"
            placeholder="Search by title or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={resetFilters}
            disabled={!isFiltered}
            className="h-10 sm:h-9"
          >
            Reset
            <Delete className="ml-2 size-4" />
          </Button>
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-4">
          {/* Year filter */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="year-filter" className="text-xs font-medium">
              Year
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[120px]" id="year-filter">
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

          {/* Sort by */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sort-filter" className="text-xs font-medium">
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="w-full sm:w-[140px]" id="sort-filter">
                <ArrowUpDown className="mr-2 size-4 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">By Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Journal filter - Full width on very small screens or wrapped */}
          <div className="col-span-2 flex flex-col gap-2 sm:col-auto">
            <Label htmlFor="journal-filter" className="text-xs font-medium">
              Journal
            </Label>
            <Select value={selectedJournal} onValueChange={setSelectedJournal}>
              <SelectTrigger className="w-full sm:w-[180px]" id="journal-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Journals</SelectItem>
                {journals.map((journal) => (
                  <SelectItem key={journal} value={journal}>
                    {journal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filtered.length} publication{filtered.length !== 1 ? "s" : ""} found
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
              className="group relative overflow-visible rounded-lg border border-border/50 p-6 transition-all duration-300 hover:border-border hover:shadow-sm"
              style={{
                animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Geometric number indicator - Rotated Square */}
              <div
                className="absolute -right-6 -top-6 flex items-center justify-center w-16 h-16 text-sm font-bold text-muted-foreground transition-all duration-300 group-hover:text-foreground cursor-default"
                style={{
                  border: "1.5px solid hsl(var(--muted-foreground) / 0.3)",
                  transform: `rotate(${getShapeRotation(index)}deg) scale(1)`,
                  transitionProperty: "transform, border-color",
                  transitionDuration: "300ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `rotate(${getShapeRotation(index)}deg) scale(1.15)`;
                  e.currentTarget.style.borderColor = "hsl(var(--foreground) / 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${getShapeRotation(index)}deg) scale(1)`;
                  e.currentTarget.style.borderColor = "hsl(var(--muted-foreground) / 0.3)";
                }}
              >
                {index + 1}
              </div>

              <div className="flex flex-col gap-4 pr-8">
                {/* Title */}
                <h2 className="text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
                  {pub.title}
                </h2>

                {/* Authors */}
                <p className="text-sm text-muted-foreground">{pub.authors}</p>

                {/* Journal/Conference/Book Info - Two Column Grid */}
                {(pub.journal || pub.conference || pub.book) && (
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-start py-2 border-t border-border/30">
                    {/* Left Column - Logo and Journal/Conference/Book */}
                    <div>
                      {pub.journal && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {pub.journalLogo && (
                              <img
                                src={pub.journalLogo}
                                alt={pub.journal}
                                className="h-12 w-12 object-contain rounded dark:bg-white dark:p-1"
                              />
                            )}
                            <div className="flex flex-col">
                              <p className="font-semibold text-sm">{pub.journal}</p>
                              {pub.impactFactor && (
                                <p className="text-xs text-muted-foreground">IF: {pub.impactFactor}</p>
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
                                className="h-12 w-12 object-contain rounded dark:bg-white dark:p-1"
                              />
                            )}
                            <p className="font-semibold text-sm">{pub.conference}</p>
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
                                className="h-12 w-12 object-contain rounded dark:bg-white dark:p-1"
                              />
                            )}
                            <div className="flex flex-col">
                              <p className="font-semibold text-sm">{pub.book}</p>
                              {pub.publisher && (
                                <p className="text-xs text-muted-foreground">{pub.publisher}</p>
                              )}
                              {pub.pages && (
                                <p className="text-xs text-muted-foreground">pp. {pub.pages}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Quartile Badge */}
                    {pub.journalQuartile && (
                      <div>
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold">
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
                </div>

                {/* DOI Link */}
                {pub.preprint && (
                  <Link
                    href={pub.preprint}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 dark:hover:text-primary/60 w-fit"
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
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 dark:hover:text-primary/60 w-fit"
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
