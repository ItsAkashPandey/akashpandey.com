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
        "skill-logo-tile relative isolate grid shrink-0 place-items-center overflow-hidden rounded-md",
        className,
      )}
    >
      <ImageWithSkeleton
        src={getColorSkillLogo(logo)}
        alt={`${name} logo`}
        width={128}
        height={96}
        sizes="96px"
        containerClassName="h-full w-full"
        skeletonClassName="bg-muted/55"
        className={cn(
          "skill-logo-color h-full w-full object-contain p-2.5 transition-[filter,transform] duration-200 group-hover/tool:scale-[1.02]",
          imageClassName,
        )}
      />
      <Image
        src={getOriginalSkillLogo(logo)}
        alt=""
        fill
        aria-hidden
        sizes="96px"
        className={cn(
          "skill-logo-detail pointer-events-none object-contain p-2.5 transition-transform duration-200 group-hover/tool:scale-[1.02]",
          imageClassName,
        )}
      />
    </span>
  );
}
