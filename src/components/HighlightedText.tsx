import { getHighlightTerms, highlightMatcher } from "@/lib/search";
import { Fragment } from "react";

export const MARK_CLASS =
  "rounded-sm bg-tone-amber/25 px-0.5 text-foreground shadow-[0_0_0_1px_hsl(var(--tone-amber)/0.2)]";

export function HighlightText({
  text,
  query,
  markClassName = MARK_CLASS,
}: {
  text?: string | number | null;
  query?: string;
  markClassName?: string;
}) {
  const value = text == null ? "" : String(text);
  const terms = getHighlightTerms(query, value);
  const matcher = highlightMatcher(terms);

  if (!value || !matcher) return <>{value}</>;

  return (
    <>
      {value.split(matcher).map((part, index) =>
        terms.includes(part.toLowerCase()) ? (
          <mark key={`${part}-${index}`} className={markClassName}>
            {part}
          </mark>
        ) : (
          <Fragment key={`${part}-${index}`}>{part}</Fragment>
        ),
      )}
    </>
  );
}
