import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import { getColorSkillLogo } from "@/lib/skill-assets";
import { cn } from "@/lib/utils";

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
    </span>
  );
}
