import {
  CATEGORY_LABELS,
  countLabel,
  type MarkerCategory,
  type MapPoint,
} from "./map-types";

/**
 * DOM markers for the contact map. Colours come from the theme variables
 * (globals.css), so they follow light and dark mode like the rest of the page.
 * Hover labels are drawn here rather than with `title`, which used to show a
 * second, native tooltip on top.
 */

const ACCENT: Record<MarkerCategory, string> = {
  activity: "hsl(var(--activity-accent))",
  education: "hsl(var(--education-accent))",
  experience: "hsl(var(--experience-accent))",
};
const HOME_ACCENT = "hsl(var(--accent-warm))";

const LABEL_CLASS =
  "pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-max max-w-[200px] -translate-x-1/2 rounded-sm bg-foreground/90 px-2 py-1 text-center text-[11px] leading-snug font-semibold text-background opacity-0 shadow-sm transition-opacity group-hover/pin:opacity-100 group-focus-visible/pin:opacity-100";

function hoverLabel(text: string) {
  const label = document.createElement("span");
  label.textContent = text;
  label.className = LABEL_CLASS;
  return label;
}

/**
 * No `relative` here: MapLibre positions markers absolutely, and its
 * stylesheet sits in the base layer (globals.css), so any Tailwind position
 * class wins over it. With `relative`, each pin sat in the normal flow below
 * the pins before it, up to a couple of hundred pixels off its place.
 */
function pinButton(ariaLabel: string, sizeClass: string) {
  const element = document.createElement("button");
  element.type = "button";
  element.setAttribute("aria-label", ariaLabel);
  element.className = `group/pin flex ${sizeClass} items-center justify-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]`;
  return element;
}

/** One place with one category: a dot in that category's ink. */
export function createPointMarker(point: MapPoint) {
  const count = point.items.length;
  const text = `${point.label}: ${countLabel(point.category, count)}`;
  const element = pinButton(text, "size-7");
  const accent = ACCENT[point.category];

  const pulse = document.createElement("span");
  pulse.className = "marker-pulse absolute size-4 rounded-full";
  pulse.style.backgroundColor = accent;
  pulse.style.opacity = "0.35";

  const dot = document.createElement("span");
  dot.className =
    "border-background relative size-3 rounded-full border-2 shadow-[0_1px_4px_rgb(0_0_0/0.35)] transition-transform duration-150 group-hover/pin:scale-125";
  dot.style.backgroundColor = accent;

  element.append(pulse, dot);

  if (count > 1) {
    const badge = document.createElement("span");
    badge.textContent = count > 9 ? "9+" : String(count);
    badge.className =
      "border-background bg-foreground text-background pointer-events-none absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border text-[10px] leading-none font-bold";
    element.append(badge);
  }

  element.append(hoverLabel(text));
  return element;
}

export type ClusterCounts = Record<MarkerCategory, number> & { home: number };

/**
 * Several points close together at this zoom. The ring is split in
 * proportion to what is inside, and carries an ochre outline when Akash's own
 * pin is part of it.
 */
export function createClusterMarker(counts: ClusterCounts) {
  const categories = Object.keys(CATEGORY_LABELS) as MarkerCategory[];
  const total = categories.reduce((sum, key) => sum + counts[key], 0);
  const parts = categories
    .filter((key) => counts[key] > 0)
    .map((key) => countLabel(key, counts[key]));
  const summary = [counts.home ? "Akash is based here" : "", parts.join(", ")]
    .filter(Boolean)
    .join(". ");
  const size = total >= 20 ? 44 : total >= 8 ? 38 : 32;

  const element = pinButton(`${summary}. Select to see them.`, "");
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;

  let angle = 0;
  const stops = categories
    .filter((key) => counts[key] > 0)
    .map((key) => {
      const start = angle;
      angle += (counts[key] / Math.max(1, total)) * 360;
      return `${ACCENT[key]} ${start}deg ${angle}deg`;
    });

  const ring = document.createElement("span");
  ring.className =
    "absolute inset-0 rounded-full shadow-[0_2px_8px_rgb(0_0_0/0.3)] transition-transform duration-150 group-hover/pin:scale-110";
  ring.style.background = stops.length
    ? `conic-gradient(${stops.join(", ")})`
    : HOME_ACCENT;
  if (counts.home)
    ring.style.boxShadow = `0 0 0 3px ${HOME_ACCENT}, 0 2px 8px rgb(0 0 0 / 0.3)`;

  const face = document.createElement("span");
  face.className =
    "bg-background text-foreground relative flex items-center justify-center rounded-full text-xs font-bold tabular-nums";
  face.style.width = `${size - 10}px`;
  face.style.height = `${size - 10}px`;
  face.textContent = String(total || 1);

  element.append(ring, face, hoverLabel(summary));
  return element;
}

/** Akash's pin (ochre) or the visitor's (teal). */
export function createLocationMarkerElement(kind: "akash" | "visitor") {
  const label = kind === "akash" ? "Akash is based here" : "Your location";
  const element = pinButton(label, "size-8");
  const accent = kind === "akash" ? HOME_ACCENT : "hsl(var(--accent-ink))";

  const ring = document.createElement("span");
  ring.className = "absolute size-5 rounded-full border";
  ring.style.borderColor = accent;
  ring.style.backgroundColor = `color-mix(in srgb, ${accent} 15%, transparent)`;

  const dot = document.createElement("span");
  dot.className =
    "border-background relative size-2.5 rounded-full border-2 shadow-md";
  dot.style.backgroundColor = accent;

  element.append(ring, dot, hoverLabel(kind === "akash" ? "Akash" : "You"));
  return element;
}
