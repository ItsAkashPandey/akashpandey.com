import { Fragment } from "react";

const DEFAULT_MARK_CLASS =
  "rounded bg-amber-200/80 px-0.5 text-foreground shadow-[0_0_0_1px_rgba(245,158,11,0.18)] dark:bg-amber-300/25";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSearchTerms(query?: string) {
  const trimmed = query?.trim();
  if (!trimmed) return [];

  const terms = [
    trimmed,
    ...trimmed.split(/\s+/).filter((term) => term.length > 1),
  ];

  return Array.from(new Set(terms.map((term) => term.toLowerCase()))).sort(
    (a, b) => b.length - a.length,
  );
}

export function HighlightText({
  text,
  query,
  markClassName = DEFAULT_MARK_CLASS,
}: {
  text?: string | number | null;
  query?: string;
  markClassName?: string;
}) {
  const value = text == null ? "" : String(text);
  const terms = getSearchTerms(query);

  if (!value || terms.length === 0) return <>{value}</>;

  const matcher = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = value.split(matcher);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = terms.includes(part.toLowerCase());
        return isMatch ? (
          <mark key={`${part}-${index}`} className={markClassName}>
            {part}
          </mark>
        ) : (
          <Fragment key={`${part}-${index}`}>{part}</Fragment>
        );
      })}
    </>
  );
}
