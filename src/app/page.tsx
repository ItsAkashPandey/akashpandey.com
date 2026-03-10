import Experience from "@/components/Experience";
import LinkWithIcon from "@/components/LinkWithIcon";
import LocationMap from "@/components/LocationMap";
import Activities from "@/components/Activities";
import Socials from "@/components/Socials";
import SwipeCards from "@/components/SwipeCards";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRightIcon,
  FileDown,
  ExternalLink,
  Wrench,
} from "lucide-react";
import ChatPromptButton from "@/components/ChatPromptButton";
import Link from "next/link";

import homeContent from "@/data/home.json";
import publicationsData from "@/data/publications.json";
import skillsData from "@/data/skills.json";

import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import { cn } from "@/lib/utils";

const AKASH_BIRTH_YEAR = 1998;
const LIMIT = 2; // max show 2

// Derive featured skills from centralized skills data to ensure consistent brand colors/gradients
const featuredSkillNames = [
  "Python", "LaTeX", "Google Earth Engine", "QGIS", "CloudCompare",
  "PhenoCam", "Trinity F90+", "AWS", "FARO TLS"
];

// Flat list of all tools from all categories
const allTools = skillsData.skills.flatMap(cat =>
  cat.subcategories.flatMap(sub => sub.tools)
);

// Map the featured names to their full tool objects from skills.json
const featuredSkills = featuredSkillNames.map(name =>
  allTools.find(tool => tool.name === name)
).filter(Boolean) as any[];

export default function Home() {
  const currentAge = new Date().getFullYear() - AKASH_BIRTH_YEAR;
  const recentPublications = publicationsData.publications
    .filter((pub) => pub.status === "Published")
    .sort((a, b) => b.year - a.year)
    .slice(0, LIMIT);

  // Count total skills
  const totalSkills = skillsData.skills.reduce(
    (acc, cat) => acc + cat.subcategories.reduce((a, sub) => a + sub.tools.length, 0),
    0
  );

  return (
    <article className="-mt-2 flex flex-col gap-16 pb-16">
      <section className="flex flex-col gap-1">
        <LocationMap />

        <div className="mt-[22px] flex flex-row-reverse items-center justify-between gap-1 sm:gap-8 md:items-center">
          <SwipeCards className="shrink-0 scale-[0.45] sm:scale-100 origin-right -mr-10 sm:mr-0" />

          <div className="flex flex-1 flex-col sm:max-w-3xl min-w-0">
            <h1 className="title text-balance text-2xl sm:text-5xl leading-tight">
              {homeContent.introduction.greeting.replace(' 👋', '')}
              <span className="ml-1 inline-block origin-bottom-right hover:animate-[wave_1.3s_ease-in-out]">👋</span>
            </h1>

            <p className="mt-2 text-sm font-medium sm:text-base">
              I work in the geospatial domain.
            </p>

            <p className="mt-4 max-w-2xl text-balance text-sm sm:text-base">
              focused on vegetation phenology using PhenoCam, UAV and Satellite data.
            </p>

            <ChatPromptButton chatPrompt={homeContent.introduction.chatPrompt} />

            <section className="mt-6 flex flex-wrap items-center gap-2 sm:gap-4">
              <Link href="/resume.pdf" target="_blank">
                <Button variant="outline" className="h-full py-3">
                  <span className="font-semibold">Resume</span>
                  <FileDown className="ml-2 size-5" />
                </Button>
              </Link>
              <Socials />
            </section>
          </div>
        </div>
      </section>

      <Experience />

      {/* Skills Section - Unique floating logo cloud design */}
      {/* Skills Section - Unique floating logo cloud design */}
      <section className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="title text-2xl sm:text-3xl">skills & tools</h2>
            <Badge variant="secondary" className="text-xs">
              {totalSkills}+
            </Badge>
          </div>
          <LinkWithIcon
            href="/skills"
            position="right"
            icon={<ArrowRightIcon className="size-5" />}
            text="view more"
          />
        </div>

        {/* Floating logo cloud with glassmorphism effect */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 via-background to-muted/20 p-6 sm:p-8">
          {/* Background decorative elements */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

          {/* Skills grid - Two rows */}
          <div className="relative z-10 flex flex-col gap-6">
            {/* Top row - Software tools */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {featuredSkills.slice(0, 5).map((skill) => (
                <div
                  key={skill.name}
                  className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
                >
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-background/80 p-3 shadow-lg ring-1 ring-border/50 backdrop-blur-sm transition-all duration-300 group-hover:ring-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10 overflow-hidden relative" >
                    <ImageWithSkeleton
                      src={skill.logo}
                      alt={skill.name}
                      width={64}
                      height={64}
                      containerClassName="w-full h-full"
                      className={cn(
                        "h-full w-full object-contain",
                        skill.invertDark && "dark:invert",
                        (skill as any).invertLight && "invert dark:invert-0"
                      )}
                    />
                  </div>
                  <span className={`text-xs sm:text-sm font-bold bg-gradient-to-r ${(skill as any).gradient} bg-clip-text text-transparent`}>
                    {skill.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom row - Instruments */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {featuredSkills.slice(5).map((skill) => (
                <div
                  key={skill.name}
                  className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
                >
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-background/80 p-3 shadow-lg ring-1 ring-border/50 backdrop-blur-sm transition-all duration-300 group-hover:ring-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10 overflow-hidden relative" >
                    <ImageWithSkeleton
                      src={skill.logo}
                      alt={skill.name}
                      width={64}
                      height={64}
                      containerClassName="w-full h-full"
                      className={cn(
                        "h-full w-full object-contain",
                        skill.invertDark && "dark:invert",
                        (skill as any).invertLight && "invert dark:invert-0"
                      )}
                    />
                  </div>
                  <span className={`text-xs sm:text-sm font-bold bg-gradient-to-r ${(skill as any).gradient} bg-clip-text text-transparent`}>
                    {skill.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom gradient hint for "more" */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Wrench className="size-4" />
            <span>and many more tools across UAVs, Surveying, GIS & Civil Engineering</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex justify-between">
          <h2 className="title text-2xl sm:text-3xl">recent publications</h2>
          <LinkWithIcon
            href="/publications"
            position="right"
            icon={<ArrowRightIcon className="size-5" />}
            text="view more"
          />
        </div>
        <div className="flex flex-col gap-4">
          {recentPublications.map((pub) => (
            <div
              key={pub.id}
              className="group rounded-lg border border-border/50 p-4 transition-all hover:border-border hover:shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold leading-snug">
                  {pub.title}
                </h3>
                <p className="text-sm text-muted-foreground">{pub.authors}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {pub.journal && (
                    <Badge variant="outline" className="text-xs">
                      {pub.journal}
                    </Badge>
                  )}
                  {pub.conference && (
                    <Badge variant="outline" className="text-xs">
                      {pub.conference}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {pub.year}
                  </Badge>
                  {pub.journalQuartile && (
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
                      {pub.journalQuartile}
                    </Badge>
                  )}
                </div>
                {pub.doi && (
                  <Link
                    href={pub.doi}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 w-fit"
                  >
                    <span>View Publication</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex justify-between">
          <h2 className="title text-2xl sm:text-3xl">recent activities</h2>
          <LinkWithIcon
            href="/activities"
            position="right"
            icon={<ArrowRightIcon className="size-5" />}
            text="view more"
          />
        </div>
        <Activities limit={LIMIT} />
      </section>
    </article >
  );
}

