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
        "border-border/45 bg-background/82 relative grid shrink-0 place-items-center overflow-hidden rounded-[15px] border shadow-[0_8px_20px_rgba(15,23,42,.07),inset_0_1px_0_rgba(255,255,255,.6)]",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_14%,rgba(255,255,255,.76),transparent_34%),linear-gradient(145deg,transparent,rgba(100,116,139,.055))] dark:opacity-35" />
      <ImageWithSkeleton
        src={getColorSkillLogo(logo)}
        alt={`${name} mark`}
        width={128}
        height={96}
        sizes="96px"
        containerClassName="h-full w-full"
        className={cn(
          "h-full w-full object-contain p-2 drop-shadow-[0_7px_8px_rgba(15,23,42,.16)] transition-transform duration-300 group-hover/tool:scale-[1.045]",
          imageClassName,
        )}
      />
    </span>
  );
}
