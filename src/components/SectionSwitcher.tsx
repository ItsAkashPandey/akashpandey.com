import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export const sectionSwitcherListClass =
  "border-border/65 grid h-auto w-full grid-cols-2 gap-0 rounded-none border-0 border-b bg-transparent p-0";

export const sectionSwitcherTriggerClass =
  "group relative flex h-auto min-w-0 items-center justify-start gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 py-2.5 text-left text-sm shadow-none transition-colors sm:gap-3 sm:px-3 data-[state=active]:border-foreground/70 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

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
          "grid size-8 shrink-0 place-items-center rounded-sm sm:size-9",
          toneClasses[tone],
        )}
      >
        <Icon className="size-4 sm:size-[18px]" strokeWidth={1.8} />
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
