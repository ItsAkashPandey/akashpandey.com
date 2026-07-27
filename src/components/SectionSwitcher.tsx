import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export const sectionSwitcherListClass =
  "border-border/65 bg-card/58 grid h-auto w-full grid-cols-2 gap-1 rounded-md border p-1 shadow-sm";

export const sectionSwitcherTriggerClass =
  "group relative flex h-auto min-w-0 items-center justify-start gap-2 rounded-sm border border-transparent bg-transparent px-2 py-2 text-left text-sm shadow-none transition-colors sm:gap-2.5 sm:px-3 data-[state=active]:border-border/70 data-[state=active]:bg-background/82 data-[state=active]:text-foreground data-[state=active]:shadow-sm";

const toneClasses = {
  sky: "bg-sky-500/11 text-sky-700 dark:text-sky-300",
  emerald: "bg-emerald-500/11 text-emerald-700 dark:text-emerald-300",
  rose: "bg-rose-500/11 text-rose-700 dark:text-rose-300",
  ocean: "bg-cyan-500/11 text-cyan-800 dark:text-cyan-300",
};

export function SectionSwitcherVisual({
  Icon,
  title,
  description,
  count,
  tone,
}: {
  Icon: LucideIcon;
  title: string;
  description?: string;
  count?: number;
  tone: keyof typeof toneClasses;
}) {
  return (
    <>
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-sm sm:size-8",
          toneClasses[tone],
        )}
      >
        <Icon className="size-3.5 sm:size-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-left text-sm leading-tight font-bold whitespace-normal sm:truncate sm:text-[15px]">
            {title}
          </span>
          {typeof count === "number" && (
            <span className="bg-muted text-muted-foreground hidden shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums sm:inline-flex">
              {count}
            </span>
          )}
        </span>
        {description && (
          <span className="text-muted-foreground mt-0.5 hidden truncate text-[11px] font-normal sm:block">
            {description}
          </span>
        )}
      </span>
    </>
  );
}
