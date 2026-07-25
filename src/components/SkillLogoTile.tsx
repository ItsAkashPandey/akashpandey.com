import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import { getColorSkillLogo, getOriginalSkillLogo } from "@/lib/skill-assets";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function SkillLogoTile({
  logo,
  name,
  className,
  imageClassName,
}: {
  logo: string;
  name: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span
      className={cn(
        "skill-logo-tile relative isolate grid shrink-0 place-items-center overflow-hidden rounded-lg",
        className,
      )}
    >
      <Image
        src={getColorSkillLogo(logo)}
        alt=""
        fill
        aria-hidden
        sizes="96px"
        className="pointer-events-none translate-x-[3px] translate-y-[2px] scale-[.94] object-contain p-2.5 opacity-30 mix-blend-multiply saturate-125 transition-[transform,opacity] duration-200 group-hover/tool:translate-x-[1px] group-hover/tool:translate-y-[1px] group-hover/tool:opacity-42 dark:mix-blend-screen"
      />
      <ImageWithSkeleton
        src={getOriginalSkillLogo(logo)}
        alt={`${name} logo`}
        width={128}
        height={96}
        sizes="96px"
        containerClassName="h-full w-full"
        skeletonClassName="bg-muted/55"
        className={cn(
          "h-full w-full object-contain p-2.5 contrast-[1.08] drop-shadow-[0_4px_4px_rgba(15,23,42,.18)] transition-transform duration-200 group-hover/tool:scale-[1.025]",
          imageClassName,
        )}
      />
    </span>
  );
}
