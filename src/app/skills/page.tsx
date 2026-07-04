"use client";

import { useState, useCallback } from "react";
import SwipeCards from "@/components/SwipeCards";
import ImageLightbox from "@/components/ImageLightbox";
import Markdown from "react-markdown";
import skillsData from "@/data/skills.json";
import { useTheme } from "next-themes";
import {
  Plane,
  Radio,
  MapPin,
  Ruler,
  Code,
  Globe,
  Camera,
  Building,
  ListTree,
} from "lucide-react";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import { cn } from "@/lib/utils";

// Map subcategory names to icons
const subcategoryIcons: Record<string, React.ReactNode> = {
  UAVs: <Plane className="text-primary h-5 w-5" />,
  "Ground Sensors": <Radio className="text-primary h-5 w-5" />,
  GPS: <MapPin className="text-primary h-5 w-5" />,
  Surveying: <Ruler className="text-primary h-5 w-5" />,
  Programming: <Code className="text-primary h-5 w-5" />,
  "Geospatial Analysis": <Globe className="text-primary h-5 w-5" />,
  Photogrammetry: <Camera className="text-primary h-5 w-5" />,
  "Civil Engineering": <Building className="text-primary h-5 w-5" />,
};

export default function SkillsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeImages, setActiveImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((images: string[]) => {
    setActiveImages(images);
    setLightboxIndex(0);
  }, []);

  const closeLightbox = useCallback(() => setActiveImages(null), []);

  return (
    <article className="relative mt-10 flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
          Instruments · software · methods
        </p>
        <h1 className="title">my skills.</h1>
        <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
          The field instruments, geospatial systems, and programming tools I use
          to turn observations into usable evidence.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start xl:gap-8">
        <aside className="border-border/60 bg-background/88 supports-[backdrop-filter]:bg-background/72 rounded-[24px] border p-3 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-2xl lg:sticky lg:top-24">
          <div className="border-border/50 flex items-center gap-2 border-b px-2 pb-3">
            <ListTree className="size-4" />
            <p className="text-sm font-semibold">Skill index</p>
          </div>
          <nav className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {skillsData.skills.map((category, index) => (
              <a
                key={category.id}
                href={`#skill-${category.id}`}
                className="hover:bg-muted group flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors"
              >
                <span className="bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background grid size-6 place-items-center rounded-lg text-[10px] font-semibold transition-colors">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{category.mainCategory}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          {skillsData.skills.map((mainCat, idx) => (
            <section
              id={`skill-${mainCat.id}`}
              key={mainCat.id}
              className="border-border/55 bg-card/35 scroll-mt-24 space-y-6 rounded-[26px] border p-5 shadow-[0_16px_42px_rgba(15,23,42,0.05)] sm:p-7"
            >
              {/* Category Header with Photo beside it */}
              {/* Category Header with Photo beside it - Side-by-side on all screens */}
              <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-12">
                {/* Photo next to header - Right on all screens */}
                <div className="mx-auto h-[233px] w-[175px] shrink-0 sm:mx-0 sm:h-[250px] sm:w-[280px]">
                  <SwipeCards
                    images={(mainCat as any).images}
                    className="h-full w-full"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2 text-center sm:gap-3 sm:text-left">
                  <h2 className="title text-2xl leading-tight sm:text-4xl">
                    {mainCat.mainCategory}
                  </h2>
                  {/* Description */}
                  <div className="prose text-muted-foreground dark:prose-invert max-w-full text-sm text-balance sm:text-base">
                    <Markdown>{mainCat.description}</Markdown>
                  </div>
                </div>
              </div>

              {/* All Subcategories in a flowing grid */}
              <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
                {mainCat.subcategories.map((subcat, subidx) => (
                  <div
                    key={subidx}
                    className="from-muted/30 to-muted/5 border-border/30 flex flex-col rounded-2xl border bg-gradient-to-br p-5"
                  >
                    {/* Subcategory Title with Icon */}
                    <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                      {subcategoryIcons[subcat.name] || (
                        <Ruler className="text-primary h-5 w-5" />
                      )}
                      {subcat.name}
                    </h3>

                    {/* Tools - 2 column grid with full width items */}
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                      {subcat.tools.map((tool, toolIdx) => (
                        <div
                          key={toolIdx}
                          onClick={() => {
                            const popupImages = (tool as any).popupImages;
                            if (popupImages && popupImages.length > 0) {
                              openLightbox(popupImages);
                            }
                          }}
                          className={`group bg-background/60 border-border/20 hover:border-primary/40 flex min-h-[54px] items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-300 ${(tool as any).popupImages ? "cursor-pointer" : ""}`}
                        >
                          {/* Logo */}
                          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center">
                            <ImageWithSkeleton
                              src={
                                isDark && (tool as any).logoDark
                                  ? (tool as any).logoDark
                                  : tool.logo
                              }
                              alt={tool.name}
                              width={36}
                              height={36}
                              containerClassName="w-full h-full"
                              className={cn(
                                "h-full w-full object-contain transition-transform duration-300 group-hover:scale-110",
                                (tool as any).invertDark && "dark:invert",
                                (tool as any).invertLight &&
                                  "invert dark:invert-0",
                              )}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg";
                              }}
                            />
                          </div>

                          {/* Tool Name - Bold Brand Gradient */}
                          <span
                            className={cn(
                              "text-sm leading-tight font-bold break-words transition-colors",
                              (tool as any).gradient
                                ? `bg-gradient-to-r ${(tool as any).gradient} bg-clip-text text-transparent`
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            {tool.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              {idx < skillsData.skills.length - 1 && (
                <div className="border-border/30 border-t" />
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Shared Image Lightbox Modal */}
      {activeImages && (
        <ImageLightbox
          images={activeImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
          imageClassName="p-3 sm:p-5 bg-white rounded-xl shadow-2xl"
        />
      )}
    </article>
  );
}
