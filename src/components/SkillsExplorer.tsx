"use client";

import ImageLightbox from "@/components/ImageLightbox";
import {
  SectionSwitcherVisual,
  sectionSwitcherListClass,
  sectionSwitcherTriggerClass,
} from "@/components/SectionSwitcher";
import SkillLogoTile from "@/components/SkillLogoTile";
import SwipeCards from "@/components/SwipeCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { toolSlug } from "@/lib/content-utils";
import type { Photo } from "@/lib/photo";
import type { SkillCategory, SkillTool } from "@/lib/schemas";
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
import { useEffect, useState } from "react";

export type SkillToolView = SkillTool & { photos: Photo[] };
export type SkillCategoryView = Omit<SkillCategory, "subcategories"> & {
  photos: Photo[];
  subcategories: { name: string; tools: SkillToolView[] }[];
};

const subcategoryConfig: Record<string, { Icon: typeof Plane; tone: string }> =
  {
    UAVs: { Icon: Plane, tone: "text-tone-amber bg-tone-amber/10" },
    "Ground Sensors": {
      Icon: RadioTower,
      tone: "text-tone-rose bg-tone-rose/10",
    },
    GPS: { Icon: MapPin, tone: "text-tone-sky bg-tone-sky/10" },
    Surveying: { Icon: Ruler, tone: "text-tone-slate bg-tone-slate/10" },
    Programming: { Icon: Code2, tone: "text-tone-violet bg-tone-violet/10" },
    "Geospatial Analysis": {
      Icon: Globe2,
      tone: "text-tone-green bg-tone-green/10",
    },
    Photogrammetry: { Icon: Camera, tone: "text-tone-teal bg-tone-teal/10" },
    "Civil Engineering": {
      Icon: Building2,
      tone: "text-tone-amber bg-tone-amber/10",
    },
  };

function categoryLabel(value: string) {
  return value === "instrument handling" ? "Field instruments" : "Software";
}

function ToolCard({
  tool,
  onOpenPhotos,
}: {
  tool: SkillToolView;
  onOpenPhotos: (tool: SkillToolView) => void;
}) {
  const hasPhotos = tool.photos.length > 0;
  const body = (
    <div className="flex min-w-0 gap-3.5">
      <SkillLogoTile
        logo={tool.logo}
        name={tool.name}
        className="h-[74px] w-[86px] rounded-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm leading-5 font-bold">{tool.name}</h4>
            {tool.model && tool.model !== tool.name && (
              <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                {tool.model}
              </p>
            )}
          </div>
          {hasPhotos && (
            <span className="bg-muted text-muted-foreground group-hover/tool:text-foreground inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold transition-colors">
              <GalleryHorizontalEnd className="size-3" aria-hidden />
              {tool.photos.length} photos
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-2 text-[13px] leading-5">
          {tool.experience}
        </p>
      </div>
    </div>
  );

  return (
    <article id={toolSlug(tool.name)} className="group/tool scroll-mt-24">
      {hasPhotos ? (
        <button
          type="button"
          onClick={() => onOpenPhotos(tool)}
          aria-label={`${tool.name}: view ${tool.photos.length} photos`}
          className="hover:bg-muted/40 focus-visible:ring-ring -mx-2 w-[calc(100%+1rem)] rounded-md px-2 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {body}
        </button>
      ) : (
        <div className="py-3">{body}</div>
      )}
    </article>
  );
}

export default function SkillsExplorer({
  categories,
}: {
  categories: SkillCategoryView[];
}) {
  const [activeId, setActiveId] = useState(String(categories[0]?.id ?? ""));
  const [lightbox, setLightbox] = useState<{
    tool: SkillToolView;
    index: number;
  } | null>(null);

  // /skills#pix4d-mapper opens the tab holding that tool and scrolls to it.
  useEffect(() => {
    const reveal = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (!slug) return;
      const category = categories.find((candidate) =>
        candidate.subcategories.some((subcategory) =>
          subcategory.tools.some((tool) => toolSlug(tool.name) === slug),
        ),
      );
      if (!category) return;
      setActiveId(String(category.id));
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document
            .getElementById(slug)
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        ),
      );
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [categories]);

  return (
    <>
      <Tabs value={activeId} onValueChange={setActiveId}>
        <TabsList className={cn(sectionSwitcherListClass, "mb-5")}>
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={String(category.id)}
              className={sectionSwitcherTriggerClass}
            >
              <SectionSwitcherVisual
                Icon={category.id === 1 ? RadioTower : Blocks}
                title={categoryLabel(category.mainCategory)}
                description={`${category.subcategories.length} groups`}
                count={category.subcategories.reduce(
                  (total, subcategory) => total + subcategory.tools.length,
                  0,
                )}
                tone={category.id === 1 ? "rose" : "teal"}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category.id}
            value={String(category.id)}
            className="mt-0"
          >
            <section className="grid gap-5 px-1 pb-6 lg:grid-cols-[minmax(0,1fr)_264px] lg:items-center">
              <div className="min-w-0">
                <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                  {categoryLabel(category.mainCategory).toLowerCase()}
                </h2>
                <p className="text-muted-foreground mt-3 max-w-[70ch] text-sm leading-6 sm:text-base">
                  {category.description}
                </p>
              </div>

              {category.photos.length ? (
                <div className="mx-auto w-fit lg:mx-0 lg:justify-self-end">
                  <SwipeCards
                    photos={category.photos}
                    alt={`${categoryLabel(category.mainCategory)} in the field`}
                    baselineWidth={4}
                    baselineHeight={3}
                  />
                </div>
              ) : (
                <div
                  aria-hidden
                  className="bg-muted/35 relative hidden aspect-square w-[180px] overflow-hidden rounded-md lg:grid lg:place-items-center"
                >
                  <Code2 className="text-primary size-12" strokeWidth={1.3} />
                </div>
              )}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              {category.subcategories.map((subcategory) => {
                const config = subcategoryConfig[subcategory.name] ?? {
                  Icon: Sparkles,
                  tone: "text-foreground bg-muted",
                };
                const SubcategoryIcon = config.Icon;

                return (
                  <section key={subcategory.name} className="min-w-0 pt-5">
                    <div className="mb-4 flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-md",
                          config.tone,
                        )}
                      >
                        <SubcategoryIcon className="size-4" aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">
                          {subcategory.name}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          {subcategory.tools.length} tools
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-1">
                      {subcategory.tools.map((tool) => (
                        <ToolCard
                          key={tool.name}
                          tool={tool}
                          onOpenPhotos={(selected) =>
                            setLightbox({ tool: selected, index: 0 })
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {lightbox && (
        <ImageLightbox
          photos={lightbox.tool.photos}
          alt={`${lightbox.tool.name} in the field`}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox({ ...lightbox, index })}
        />
      )}
    </>
  );
}
