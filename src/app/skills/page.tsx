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
    accent: "text-violet-700 dark:text-violet-300",
    surface: "bg-violet-500/10",
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
    <article className="relative mt-10 flex flex-col gap-8 pb-16">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="title">my skills.</h1>
        <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
          The equipment and tools I have actually used—not a keyword list.
        </p>
      </header>

      <section className="border-border/55 bg-card/42 overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
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
                  tone={category.id === 1 ? "rose" : "indigo"}
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
            <p className="text-muted-foreground mt-4 max-w-3xl text-sm leading-7 sm:text-base">
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
            <div className="border-border/50 bg-muted/25 relative hidden aspect-square w-[210px] overflow-hidden rounded-[26px] border lg:grid lg:place-items-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,.14),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,.12),transparent_35%)]" />
              <div className="border-border/60 bg-background/80 relative grid size-24 place-items-center rounded-[28px] border shadow-[0_20px_55px_rgba(15,23,42,.12)] backdrop-blur-xl">
                <Code2 className="size-9" strokeWidth={1.5} />
              </div>
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
              className="border-border/55 bg-card/35 min-w-0 rounded-[24px] border p-4 shadow-[0_14px_40px_rgba(15,23,42,0.045)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl",
                      config.surface,
                      config.accent,
                    )}
                  >
                    <SubcategoryIcon className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold">{subcategory.name}</h2>
                    <p className="text-muted-foreground text-[10px]">
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
                      className="border-border/55 bg-background/72 group/tool overflow-hidden rounded-[19px] border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,.09)]"
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
                                    <span className="text-muted-foreground mt-0.5 block text-[10px] font-medium">
                                      {tool.model}
                                    </span>
                                  )}
                              </span>
                              {interactive && (
                                <span className="bg-muted text-muted-foreground group-hover/tool:text-foreground inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold transition-colors">
                                  <GalleryHorizontalEnd className="size-3" />
                                  photos
                                </span>
                              )}
                            </span>
                            {"experience" in tool && (
                              <span className="text-muted-foreground mt-2 block text-xs leading-5">
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
