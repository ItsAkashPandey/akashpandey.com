import Activities from "@/components/Activities";
import ChatPromptButton from "@/components/ChatPromptButton";
import Experience from "@/components/Experience";
import PlacesGlobe from "@/components/globe/PlacesGlobe";
import LinkWithIcon from "@/components/LinkWithIcon";
import SectionHeading from "@/components/SectionHeading";
import SkillLogoTile from "@/components/SkillLogoTile";
import Socials from "@/components/Socials";
import SwipeCards from "@/components/SwipeCards";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import homeContent from "@/data/home.json";
import {
  getAllTools,
  getCareer,
  getEducation,
  getPublications,
} from "@/lib/content";
import {
  publicationHref,
  publicationLink,
  toolSlug,
} from "@/lib/content-utils";
import { buildGlobeData } from "@/lib/globe-data";
import { getPhotos } from "@/lib/photos";
import { jsonLdProps, profilePageSchema } from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, ExternalLink, FileDown, Wrench } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

const RECENT_COUNT = 2;

const FEATURED_SKILLS = [
  "Python",
  "LaTeX",
  "Google Earth Engine",
  "QGIS",
  "CloudCompare",
  "PhenoCam",
  "Trinity F90+",
  "Weather Station",
  "FARO TLS",
];

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/** "Jul 2026" -> a sortable number. */
function monthValue(value: string) {
  const [month, year] = value.split(" ");
  return Number(year) * 12 + Math.max(0, MONTHS.indexOf(month));
}

/** "Project Fellow (post-doc) at IIT Roorkee and Co-Director at Bhoomicam". */
function CurrentRoles() {
  const roles = getCareer()
    .flatMap((org) =>
      org.positions
        .filter((position) => position.end === "Present")
        .map((position) => ({
          title: position.title,
          org: org.shortName,
          start: monthValue(position.start),
        })),
    )
    .sort((a, b) => b.start - a.start);
  return roles.map((role, index) => (
    <Fragment key={`${role.title}-${role.org}`}>
      {index > 0 && (index === roles.length - 1 ? " and " : ", ")}
      {/* Keeps "Co-Director" from breaking at its hyphen. */}
      <span className="whitespace-nowrap">{role.title}</span> at {role.org}
    </Fragment>
  ));
}

function latestDegree() {
  const [school] = getEducation();
  const degree = school?.positions[0];
  if (!degree) return "";
  return `${degree.title}, ${school.shortName}${
    degree.end && degree.end !== "Present" ? ` (${degree.end.slice(-4)})` : ""
  }`;
}

const SkillTile = ({
  skill,
}: {
  skill: ReturnType<typeof getAllTools>[number];
}) => (
  <Link
    href={`/skills#${toolSlug(skill.name)}`}
    className="group/tool flex flex-col items-center gap-1.5 transition-transform duration-200 hover:-translate-y-0.5 sm:gap-2"
  >
    <SkillLogoTile
      logo={skill.logo}
      name={skill.name}
      className="size-11 sm:size-16"
      imageClassName="p-1.5 sm:p-2.5"
    />
    <span className="text-foreground/85 max-w-[76px] text-center text-[11px] leading-tight font-semibold sm:max-w-[110px] sm:text-sm">
      {skill.name}
    </span>
  </Link>
);

export default function Home() {
  const { introduction, portraits } = homeContent;
  const tools = getAllTools();
  const featuredSkills = FEATURED_SKILLS.map((name) =>
    tools.find((tool) => tool.name === name),
  ).filter((tool) => tool !== undefined);
  const recentPublications = getPublications()
    .filter((publication) => publication.status === "Published")
    .sort((a, b) => b.year - a.year)
    .slice(0, RECENT_COUNT);

  return (
    <article className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-10 pb-16 sm:mt-8 sm:gap-12">
      <script {...jsonLdProps(profilePageSchema)} />
      <section className="record-surface relative flex flex-col gap-1 overflow-hidden rounded-lg p-3 sm:p-5">
        <div className="flex flex-col gap-6 px-2 py-2 sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-10 sm:px-4 sm:py-4">
          <SwipeCards
            photos={getPhotos(portraits)}
            alt="Akash Kumar"
            priority
            className="mx-auto shrink-0 sm:mx-0"
          />

          <div className="flex min-w-0 flex-1 flex-col items-center text-center sm:max-w-3xl sm:items-start sm:text-left">
            <h1 className="title text-[1.9rem] leading-tight text-balance sm:text-[2.6rem]">
              {introduction.greeting}
              <span
                aria-hidden
                className="ml-2 inline-block origin-bottom-right hover:animate-[wave_1.3s_ease-in-out]"
              >
                👋
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-lg leading-snug font-medium text-balance sm:text-xl">
              {introduction.lede}
            </p>

            <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm text-balance sm:mx-0 sm:text-base">
              <span className="text-foreground font-semibold">
                {introduction.name}
              </span>
              , <CurrentRoles />. {latestDegree()}.
            </p>

            <div className="mx-auto w-full max-w-md sm:mx-0">
              <ChatPromptButton chatPrompt={introduction.chatPrompt} />
            </div>

            <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3 sm:justify-start sm:gap-4">
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-9 px-3 text-sm sm:h-10 sm:px-4",
                )}
              >
                <span className="font-semibold">Resume</span>
                <FileDown className="size-4" aria-hidden />
              </a>
              <Socials />
            </div>
          </div>
        </div>
      </section>

      {/* No content-visibility on these sections. It held 640px for each
          until scrolled near, but on a phone they run to 2,000px, so a jump
          down the page landed in the wrong place and slid away. Skipping
          them saved no measurable time. */}
      <section
        id="experience"
        className="paper-band paper-band--sage scroll-mt-20"
      >
        <div className="flex flex-col gap-5">
          <SectionHeading title="the path so far" />
          <Experience />
        </div>
      </section>

      <section className="paper-band paper-band--paper">
        <div className="flex flex-col gap-7">
          <SectionHeading
            title="skills & tools"
            detail={
              <Badge variant="secondary" className="text-xs">
                {tools.length}
              </Badge>
            }
            action={
              <LinkWithIcon
                href="/skills"
                position="right"
                icon={<ArrowRightIcon className="size-5" />}
                text="view all"
              />
            }
          />

          <div className="relative overflow-hidden py-1">
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-6">
                {featuredSkills.slice(0, 5).map((skill) => (
                  <SkillTile key={skill.name} skill={skill} />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-6">
                {featuredSkills.slice(5).map((skill) => (
                  <SkillTile key={skill.name} skill={skill} />
                ))}
              </div>
            </div>

            <div className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-center text-sm">
              <Wrench className="size-4 shrink-0" aria-hidden />
              <span>
                and more across UAVs, surveying, GIS and civil engineering
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="paper-band paper-band--blue">
        <div className="flex flex-col gap-7">
          <SectionHeading
            title="recent publications"
            action={
              <LinkWithIcon
                href="/publications"
                position="right"
                icon={<ArrowRightIcon className="size-5" />}
                text="view all"
              />
            }
          />
          <div className="flex flex-col gap-4">
            {recentPublications.map((publication) => {
              const link = publicationLink(publication);
              return (
                <div
                  key={publication.id}
                  className="border-border/70 border-b py-5 last:border-b-0"
                >
                  <div className="flex flex-col gap-3">
                    <h3 className="text-base leading-snug font-semibold">
                      <Link
                        href={publicationHref(publication.slug)}
                        className="hover:text-ink transition-colors"
                      >
                        {publication.title}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {publication.authors}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[11px]">
                        {publication.type}
                      </Badge>
                      {(publication.journal || publication.conference) && (
                        <Badge variant="outline" className="text-xs">
                          {publication.journal || publication.conference}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {publication.year}
                      </Badge>
                      {publication.journalQuartile && (
                        <Badge className="bg-tone-green/10 text-tone-green text-xs">
                          {publication.journalQuartile}
                        </Badge>
                      )}
                    </div>
                    {link && (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-ink inline-flex w-fit items-center gap-2 text-sm font-medium underline-offset-4 transition-colors hover:underline"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="paper-band paper-band--coral">
        <div className="flex flex-col gap-7">
          <SectionHeading
            title="recent activities"
            action={
              <LinkWithIcon
                href="/activities"
                position="right"
                icon={<ArrowRightIcon className="size-5" />}
                text="view all"
              />
            }
          />
          <Activities limit={RECENT_COUNT} />
        </div>
      </section>

      <section className="paper-band paper-band--blue">
        <div className="flex flex-col gap-7">
          <SectionHeading
            title="places along the way"
            action={
              <LinkWithIcon
                href="/contact#map"
                position="right"
                icon={<ArrowRightIcon className="size-5" />}
                text="full map"
              />
            }
          />
          <PlacesGlobe data={buildGlobeData()} />
        </div>
      </section>
    </article>
  );
}
