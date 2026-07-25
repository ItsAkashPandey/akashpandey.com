"use client";

import ImageLightbox from "@/components/ImageLightbox";
import {
  SectionSwitcherVisual,
  sectionSwitcherListClass,
  sectionSwitcherTriggerClass,
} from "@/components/SectionSwitcher";
import SkillLogoTile from "@/components/SkillLogoTile";
import SwipeCards from "@/components/SwipeCards";
import skillsData from "@/data/skills.json";
import { cn } from "@/lib/utils";
import {
  Blocks,
  Building2,
  Camera,
  Code2,
  GalleryHorizontalEnd,
  Globe2,
  MapPin,
  Plane,
  RadioTower,
  Ruler,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const subcategoryConfig: Record<
  string,
  { Icon: typeof Plane; accent: string; surface: string }
> = {
  UAVs: {
    Icon: Plane,
    accent: "text-orange-700 dark:text-orange-300",
    surface: "bg-orange-500/10",
  },
  "Ground Sensors": {
    Icon: RadioTower,
    accent: "text-rose-700 dark:text-rose-300",
    surface: "bg-rose-500/10",
  },
  GPS: {
    Icon: MapPin,
    accent: "text-sky-700 dark:text-sky-300",
    surface: "bg-sky-500/10",
  },
  Surveying: {
    Icon: Ruler,
    accent: "text-slate-700 dark:text-slate-300",
    surface: "bg-slate-500/10",
  },
  Programming: {
    Icon: Code2,
    accent: "text-blue-700 dark:text-blue-300",
    surface: "bg-blue-500/10",
  },
  "Geospatial Analysis": {
    Icon: Globe2,
    accent: "text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-500/10",
  },
  Photogrammetry: {
    Icon: Camera,
    accent: "text-cyan-700 dark:text-cyan-300",
    surface: "bg-cyan-500/10",
  },
  "Civil Engineering": {
    Icon: Building2,
    accent: "text-amber-800 dark:text-amber-300",
    surface: "bg-amber-500/10",
  },
};

function categoryLabel(value: string) {
  return value === "instrument handling" ? "Field instruments" : "Software";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SkillsPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(
    skillsData.skills[0]?.id ?? 1,
  );
  const [activeImages, setActiveImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const activeCategory = useMemo(
    () =>
      skillsData.skills.find((category) => category.id === activeCategoryId) ??
      skillsData.skills[0],
    [activeCategoryId],
  );

  const openLightbox = useCallback((images: string[]) => {
    setActiveImages(images);
    setLightboxIndex(0);
  }, []);

  useEffect(() => {
    const revealHashTool = () => {
      const slug = window.location.hash.replace(/^#/, "");
      if (!slug) return;
      const category = skillsData.skills.find((candidate) =>
        candidate.subcategories.some((subcategory) =>
          subcategory.tools.some((tool) => slugify(tool.name) === slug),
        ),
      );
      if (!category) return;

      setActiveCategoryId(category.id);
      window.setTimeout(() => {
        document.getElementById(slug)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 80);
    };

    revealHashTool();
    window.addEventListener("hashchange", revealHashTool);
    return () => window.removeEventListener("hashchange", revealHashTool);
  }, []);

  if (!activeCategory) return null;

  const categoryImages =
    "images" in activeCategory ? activeCategory.images : [];

  return (
    <article className="page-shell relative">
      <header className="page-heading">
        <h1 className="title">my skills.</h1>
      </header>

      <section className="paper-band paper-band--paper">
        <div
          className={cn(sectionSwitcherListClass, "mb-6")}
          role="tablist"
          aria-label="Skills sections"
        >
          {skillsData.skills.map((category) => {
            const active = category.id === activeCategory.id;
            const Icon = category.id === 1 ? RadioTower : Blocks;
            const count = category.subcategories.reduce(
              (total, subcategory) => total + subcategory.tools.length,
              0,
            );

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-state={active ? "active" : "inactive"}
                onClick={() => setActiveCategoryId(category.id)}
                className={sectionSwitcherTriggerClass}
              >
                <SectionSwitcherVisual
                  Icon={Icon}
                  title={categoryLabel(category.mainCategory)}
                  description={`${category.subcategories.length} groups`}
                  count={count}
                  tone={category.id === 1 ? "rose" : "ocean"}
                />
              </button>
            );
          })}
        </div>

        <div className="grid gap-7 px-2 pb-2 sm:px-3 sm:pb-3 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-center">
          <div className="min-w-0">
            <h2 className="title text-3xl leading-tight sm:text-4xl">
              {categoryLabel(activeCategory.mainCategory).toLowerCase()}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-[70ch] text-sm leading-7 sm:text-base">
              {activeCategory.description}
            </p>
          </div>

          {categoryImages?.length ? (
            <div className="mx-auto h-[188px] w-[250px] lg:mx-0 lg:justify-self-end">
              <SwipeCards
                images={categoryImages}
                baselineWidth={4}
                baselineHeight={3}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="bg-muted/45 relative hidden aspect-square w-[210px] overflow-hidden rounded-lg lg:grid lg:place-items-center">
              <Code2 className="text-primary size-12" strokeWidth={1.3} />
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {activeCategory.subcategories.map((subcategory) => {
          const config = subcategoryConfig[subcategory.name] ?? {
            Icon: Sparkles,
            accent: "text-foreground",
            surface: "bg-muted",
          };
          const SubcategoryIcon = config.Icon;

          return (
            <section
              key={subcategory.name}
              className="border-border/70 min-w-0 border-t pt-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-md",
                      config.surface,
                      config.accent,
                    )}
                  >
                    <SubcategoryIcon className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold">{subcategory.name}</h2>
                    <p className="text-muted-foreground text-[11px]">
                      {subcategory.tools.length} tools
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {subcategory.tools.map((tool) => {
                  const popupImages =
                    "popupImages" in tool ? tool.popupImages : undefined;
                  const interactive = Boolean(popupImages?.length);

                  return (
                    <article
                      key={tool.name}
                      id={slugify(tool.name)}
                      className="record-surface group/tool overflow-hidden rounded-lg transition-shadow hover:shadow-lg"
                    >
                      <button
                        type="button"
                        disabled={!interactive}
                        onClick={() =>
                          popupImages?.length && openLightbox(popupImages)
                        }
                        className="w-full p-3 text-left disabled:cursor-default"
                      >
                        <div className="flex min-w-0 gap-3.5">
                          <SkillLogoTile
                            logo={tool.logo}
                            name={tool.name}
                            className="h-[82px] w-[96px]"
                          />

                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span>
                                <span className="block text-sm leading-5 font-bold">
                                  {tool.name}
                                </span>
                                {"model" in tool &&
                                  tool.model !== tool.name && (
                                    <span className="text-muted-foreground mt-0.5 block text-[11px] font-medium">
                                      {tool.model}
                                    </span>
                                  )}
                              </span>
                              {interactive && (
                                <span className="bg-muted text-muted-foreground group-hover/tool:text-foreground inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors">
                                  <GalleryHorizontalEnd className="size-3" />
                                  photos
                                </span>
                              )}
                            </span>
                            {"experience" in tool && (
                              <span className="text-muted-foreground mt-2 block text-[13px] leading-5">
                                {tool.experience}
                              </span>
                            )}
                          </span>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>

      {activeImages && (
        <ImageLightbox
          images={activeImages}
          currentIndex={lightboxIndex}
          onClose={() => setActiveImages(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </article>
  );
}
