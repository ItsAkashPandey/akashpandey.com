import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * A bordered box holding bordered buttons drew two hard rectangles around the
 * same control. One hairline runs under the whole rail instead, and the active
 * tab claims a segment of it in the accent ink — the same rule the section
 * headings use, so the switcher reads as part of the page rather than as a
 * widget dropped onto it.
 */
export const sectionSwitcherListClass =
  "border-border/60 grid h-auto w-full grid-cols-2 gap-0 rounded-none border-0 border-b bg-transparent p-0 shadow-none";

export const sectionSwitcherTriggerClass =
  "group relative flex h-auto min-w-0 items-center justify-start gap-2 rounded-none border-0 bg-transparent px-1 pt-2 pb-3 text-left text-sm shadow-none transition-colors sm:gap-3 sm:px-2 after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:origin-left after:scale-x-0 after:bg-[hsl(var(--accent-ink))] after:transition-transform after:duration-200 data-[state=active]:after:scale-x-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground";

/**
 * Ink only. A pastel rounded square behind a line icon is the most generic
 * thing an interface can do, and it was on every switcher, filter and card on
 * the site. The colour coding survives — it just lives in the stroke now.
 */
const toneClasses = {
  sky: "text-sky-700 dark:text-sky-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  rose: "text-rose-700 dark:text-rose-300",
  ocean: "text-cyan-800 dark:text-cyan-300",
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
          "grid shrink-0 place-items-center transition-opacity group-data-[state=inactive]:opacity-45",
          toneClasses[tone],
        )}
      >
        <Icon className="size-[1.15rem] sm:size-5" strokeWidth={1.45} />
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
