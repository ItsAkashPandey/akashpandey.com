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
} from "lucide-react";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import { cn } from "@/lib/utils";

// Map subcategory names to icons
const subcategoryIcons: Record<string, React.ReactNode> = {
  "UAVs": <Plane className="w-5 h-5 text-primary" />,
  "Ground Sensors": <Radio className="w-5 h-5 text-primary" />,
  "GPS": <MapPin className="w-5 h-5 text-primary" />,
  "Surveying": <Ruler className="w-5 h-5 text-primary" />,
  "Programming": <Code className="w-5 h-5 text-primary" />,
  "Geospatial Analysis": <Globe className="w-5 h-5 text-primary" />,
  "Photogrammetry": <Camera className="w-5 h-5 text-primary" />,
  "Civil Engineering": <Building className="w-5 h-5 text-primary" />,
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
    <div className="flex flex-col gap-16 pb-16 relative">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="title text-3xl sm:text-4xl">my skills.</h1>
      </div>

      {/* Main Categories */}
      <div className="flex flex-col gap-20">
        {skillsData.skills.map((mainCat, idx) => (
          <div key={mainCat.id} className="space-y-8">
            {/* Category Header with Photo beside it */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col gap-3">
                <h2 className="title text-2xl sm:text-3xl">{mainCat.mainCategory}</h2>
                {/* Description */}
                <div className="prose mb-6 max-w-full text-justify text-sm text-muted-foreground dark:prose-invert sm:text-base">
                  <Markdown>{mainCat.description}</Markdown>
                </div>
              </div>
              {/* Photo next to header */}
              <div className="flex justify-center md:justify-end">
                <SwipeCards images={(mainCat as any).images} className="w-full max-w-[280px]" />
              </div>
            </div>

            {/* All Subcategories in a flowing grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {mainCat.subcategories.map((subcat, subidx) => (
                <div
                  key={subidx}
                  className="p-5 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/5 border border-border/30 flex flex-col"
                >
                  {/* Subcategory Title with Icon */}
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    {subcategoryIcons[subcat.name] || <Ruler className="w-5 h-5 text-primary" />}
                    {subcat.name}
                  </h3>

                  {/* Tools - 2 column grid with full width items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    {subcat.tools.map((tool, toolIdx) => (
                      <div
                        key={toolIdx}
                        onClick={() => {
                          const popupImages = (tool as any).popupImages;
                          if (popupImages && popupImages.length > 0) {
                            openLightbox(popupImages);
                          }
                        }}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background/60 border border-border/20 hover:border-primary/40 transition-all duration-300 min-h-[54px] ${(tool as any).popupImages ? "cursor-pointer" : ""}`}
                      >
                        {/* Logo */}
                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center relative">
                          <ImageWithSkeleton
                            src={(isDark && (tool as any).logoDark) ? (tool as any).logoDark : tool.logo}
                            alt={tool.name}
                            width={36}
                            height={36}
                            containerClassName="w-full h-full"
                            className={cn(
                              "w-full h-full object-contain transition-transform duration-300 group-hover:scale-110",
                              (tool as any).invertDark && "dark:invert",
                              (tool as any).invertLight && "invert dark:invert-0"
                            )}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg";
                            }}
                          />
                        </div>

                        {/* Tool Name - Bold Brand Gradient */}
                        <span className={cn(
                          "text-sm font-bold leading-tight break-words transition-colors",
                          (tool as any).gradient
                            ? `bg-gradient-to-r ${(tool as any).gradient} bg-clip-text text-transparent`
                            : "text-muted-foreground group-hover:text-foreground"
                        )}>
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
              <div className="border-t border-border/30 mt-4" />
            )}
          </div>
        ))}
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
    </div>
  );
}
