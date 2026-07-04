import Experience from "@/components/Experience";
import LinkWithIcon from "@/components/LinkWithIcon";
import Activities from "@/components/Activities";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon, FileDown, ExternalLink, Wrench } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

import homeContent from "@/data/home.json";
import publicationsData from "@/data/publications.json";
import skillsData from "@/data/skills.json";

import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import LazySection from "@/components/LazySection";
import { cn } from "@/lib/utils";

const LocationMap = dynamic(() => import("@/components/LocationMap"), {
  loading: () => (
    <div className="border-border/50 bg-muted/40 h-[270px] w-full animate-pulse rounded-2xl border" />
  ),
});

const SwipeCards = dynamic(() => import("@/components/SwipeCards"), {
  loading: () => (
    <div className="border-border/50 bg-muted/40 h-[233px] w-[175px] animate-pulse rounded-xl border" />
  ),
});

const Socials = dynamic(() => import("@/components/Socials"), {
  loading: () => (
    <div className="bg-muted/40 h-8 w-40 animate-pulse rounded-md" />
  ),
});

const ChatPromptButton = dynamic(
  () => import("@/components/ChatPromptButton"),
  {
    loading: () => (
      <div className="bg-muted/40 mt-6 h-6 w-60 animate-pulse rounded-md" />
    ),
  },
);

const AKASH_BIRTH_YEAR = 1998;
const LIMIT = 2; // max show 2

// Derive featured skills from centralized skills data to ensure consistent brand colors/gradients
const featuredSkillNames = [
  "Python",
  "LaTeX",
  "Google Earth Engine",
  "QGIS",
  "CloudCompare",
  "PhenoCam",
  "Trinity F90+",
  "AWS",
  "FARO TLS",
];

// Flat list of all tools from all categories
const allTools = skillsData.skills.flatMap((cat) =>
  cat.subcategories.flatMap((sub) => sub.tools),
);

// Map the featured names to their full tool objects from skills.json
const featuredSkills = featuredSkillNames
  .map((name) => allTools.find((tool) => tool.name === name))
  .filter(Boolean) as any[];

export default function Home() {
  const currentAge = new Date().getFullYear() - AKASH_BIRTH_YEAR;
  const recentPublications = publicationsData.publications
    .filter((pub) => pub.status === "Published")
    .sort((a, b) => b.year - a.year)
    .slice(0, LIMIT);

  // Count total skills
  const totalSkills = skillsData.skills.reduce(
    (acc, cat) =>
      acc + cat.subcategories.reduce((a, sub) => a + sub.tools.length, 0),
    0,
  );

  return (
    <article className="mx-auto -mt-2 flex w-full max-w-6xl flex-col gap-10 pb-16 sm:gap-12">
      <section className="border-border/55 bg-card/40 relative flex flex-col gap-1 overflow-hidden rounded-[30px] border p-3 shadow-[0_20px_55px_rgba(15,23,42,0.07)] sm:p-5">
        <LocationMap />

        <div className="mt-6 flex flex-col gap-6 px-2 pb-2 sm:mt-[22px] sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-10 sm:px-4 sm:pb-4">
          <SwipeCards className="mx-auto shrink-0 sm:mx-0" />

          <div className="flex min-w-0 flex-1 flex-col text-center sm:max-w-3xl sm:text-left">
            <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.18em] uppercase">
              Geospatial researcher · builder
            </p>
            <h1 className="title text-3xl leading-tight text-balance sm:text-5xl">
              {homeContent.introduction.greeting.replace(" 👋", "")}
              <span className="ml-1 inline-block origin-bottom-right hover:animate-[wave_1.3s_ease-in-out]">
                👋
              </span>
            </h1>

            <p className="mt-2 text-sm font-medium sm:text-base">
              I work in the geospatial domain.
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-sm text-balance sm:mx-0 sm:text-base">
              focused on vegetation phenology using PhenoCam, UAV and Satellite
              data.
            </p>

            <ChatPromptButton
              chatPrompt={homeContent.introduction.chatPrompt}
            />

            <section className="mt-6 flex flex-wrap items-center justify-center gap-2 px-0 sm:justify-start sm:gap-4">
              <Link href="/resume.pdf" target="_blank">
                <Button
                  variant="outline"
                  className="h-[32px] px-2 py-1 text-[11px] sm:h-full sm:px-4 sm:py-3 sm:text-sm"
                >
                  <span className="font-semibold">Resume</span>
                  <FileDown className="ml-1 size-3.5 sm:ml-2 sm:size-5" />
                </Button>
              </Link>
              <Socials />
            </section>
          </div>
        </div>
      </section>

      <LazySection
        heightHint={260}
        className="border-border/55 bg-card/35 rounded-[28px] border p-5 shadow-[0_18px_48px_rgba(15,23,42,0.055)] sm:p-8"
      >
        <section className="flex flex-col gap-6">
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
              Background
            </p>
            <h2 className="title mt-2 text-2xl sm:text-3xl">the path so far</h2>
          </div>
          <Experience />
        </section>
      </LazySection>

      {/* Skills Section - Unique floating logo cloud design */}
      <LazySection
        heightHint={350}
        className="border-border/55 bg-card/35 rounded-[28px] border p-5 shadow-[0_18px_48px_rgba(15,23,42,0.055)] sm:p-8"
      >
        <section className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
                  Working set
                </p>
                <h2 className="title mt-2 text-2xl sm:text-3xl">
                  skills & tools
                </h2>
              </div>
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
          <div className="border-border/50 from-muted/30 via-background to-muted/20 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-8">
            {/* Background decorative elements */}
            <div className="bg-primary/5 absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl" />
            <div className="bg-primary/5 absolute -bottom-20 -left-20 h-40 w-40 rounded-full blur-3xl" />

            {/* Skills grid - Two rows */}
            <div className="relative z-10 flex flex-col gap-6">
              {/* Top row - Software tools */}
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-6">
                {featuredSkills.slice(0, 5).map((skill) => (
                  <div
                    key={skill.name}
                    className="group flex flex-col items-center gap-1.5 transition-all duration-300 hover:scale-110 sm:gap-2"
                  >
                    <div className="bg-background/80 ring-border/50 group-hover:ring-primary/50 group-hover:shadow-primary/10 relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl p-2 shadow-lg ring-1 backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl sm:h-16 sm:w-16 sm:p-3">
                      <ImageWithSkeleton
                        src={skill.logo}
                        alt={skill.name}
                        width={64}
                        height={64}
                        containerClassName="w-full h-full"
                        className={cn(
                          "h-full w-full object-contain",
                          skill.invertDark && "dark:invert",
                          (skill as any).invertLight && "invert dark:invert-0",
                        )}
                      />
                    </div>
                    <span
                      className={`max-w-[56px] bg-gradient-to-r text-center text-[10px] leading-tight font-bold sm:max-w-none sm:text-sm ${(skill as any).gradient} bg-clip-text text-transparent`}
                    >
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom row - Instruments */}
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-6">
                {featuredSkills.slice(5).map((skill) => (
                  <div
                    key={skill.name}
                    className="group flex flex-col items-center gap-1.5 transition-all duration-300 hover:scale-110 sm:gap-2"
                  >
                    <div className="bg-background/80 ring-border/50 group-hover:ring-primary/50 group-hover:shadow-primary/10 relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl p-2 shadow-lg ring-1 backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl sm:h-16 sm:w-16 sm:p-3">
                      <ImageWithSkeleton
                        src={skill.logo}
                        alt={skill.name}
                        width={64}
                        height={64}
                        containerClassName="w-full h-full"
                        className={cn(
                          "h-full w-full object-contain",
                          skill.invertDark && "dark:invert",
                          (skill as any).invertLight && "invert dark:invert-0",
                        )}
                      />
                    </div>
                    <span
                      className={`max-w-[56px] bg-gradient-to-r text-center text-[10px] leading-tight font-bold sm:max-w-none sm:text-sm ${(skill as any).gradient} bg-clip-text text-transparent`}
                    >
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom gradient hint for "more" */}
            <div className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-sm">
              <Wrench className="size-4" />
              <span>
                and many more tools across UAVs, Surveying, GIS & Civil
                Engineering
              </span>
            </div>
          </div>
        </section>
      </LazySection>

      <LazySection
        heightHint={300}
        className="border-border/55 bg-card/35 rounded-[28px] border p-5 shadow-[0_18px_48px_rgba(15,23,42,0.055)] sm:p-8"
      >
        <section className="flex flex-col gap-8">
          <div className="flex justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
                Selected research
              </p>
              <h2 className="title mt-2 text-2xl sm:text-3xl">
                recent publications
              </h2>
            </div>
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
                className="group border-border/50 hover:border-border rounded-lg border p-4 transition-all hover:shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="text-base leading-snug font-semibold">
                    {pub.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{pub.authors}</p>
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
                      <Badge className="bg-green-500/10 text-xs text-green-700 dark:text-green-400">
                        {pub.journalQuartile}
                      </Badge>
                    )}
                  </div>
                  {pub.doi && (
                    <Link
                      href={pub.doi}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary/80 inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors"
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
      </LazySection>

      <LazySection
        heightHint={400}
        className="border-border/55 bg-card/35 rounded-[28px] border p-5 shadow-[0_18px_48px_rgba(15,23,42,0.055)] sm:p-8"
      >
        <section className="flex flex-col gap-8">
          <div className="flex justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
                In the field
              </p>
              <h2 className="title mt-2 text-2xl sm:text-3xl">
                recent activities
              </h2>
            </div>
            <LinkWithIcon
              href="/activities"
              position="right"
              icon={<ArrowRightIcon className="size-5" />}
              text="view more"
            />
          </div>
          <Activities limit={LIMIT} />
        </section>
      </LazySection>
    </article>
  );
}
