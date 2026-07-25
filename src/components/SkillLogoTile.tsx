import SkillGlyph from "@/components/SkillGlyph";
import { cn } from "@/lib/utils";

export default function SkillLogoTile({
  name,
  className,
}: {
  logo: string;
  name: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span
      className={cn(
        "border-border/45 bg-muted/18 relative grid shrink-0 place-items-center overflow-hidden rounded-[15px] border shadow-[0_7px_18px_rgba(15,23,42,.055)] dark:bg-white/[.035]",
        className,
      )}
    >
      <SkillGlyph name={name} />
    </span>
  );
}
