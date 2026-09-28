import {
  CATEGORY_LABELS,
  countLabel,
  type MapItem,
  type MapPoint,
  type MarkerCategory,
} from "./map-types";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Popups are HTML strings (MapLibre's `setHTML`), so every value is escaped. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

const CHEVRON_SVG =
  '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const EXTERNAL_SVG =
  '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 4.5H4.5v11h11V12M11.5 4.5h4v4M15.5 4.5 9 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as MarkerCategory[];

/** Internal links carry data-internal, which the map turns into client-side navigation. */
function rows(items: MapItem[]) {
  return items
    .map(
      (item) => `<li><a class="map-popup-row" href="${escapeHtml(item.href)}" data-internal>
        <span class="map-popup-text">
          <span class="map-popup-name">${escapeHtml(item.title)}</span>
          <span class="map-popup-date">${escapeHtml(item.when)}</span>
        </span>
        ${CHEVRON_SVG}
      </a></li>`,
    )
    .join("");
}

function websiteLink(point: MapPoint) {
  if (!point.website) return "";
  return `<a class="map-popup-site" href="${escapeHtml(point.website)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(point.label)} website" title="Website">${EXTERNAL_SVG}</a>`;
}

/** The popup for a single point: one place, one category. */
export function pointPopupHtml(point: MapPoint) {
  return `<div class="map-popup-card" data-category="${point.category}">
    <header class="map-popup-head">
      <span class="map-popup-place">${escapeHtml(point.label)}</span>
      ${websiteLink(point)}
      <span class="map-popup-count">${escapeHtml(countLabel(point.category, point.items.length))}</span>
    </header>
    <ul class="map-popup-list">${rows(point.items)}</ul>
  </div>`;
}

/**
 * The popup for points that share one spot and cannot be pulled apart by
 * zooming (the IIT Roorkee campus holds activities, the PhD, and two jobs):
 * everything there, grouped by kind.
 */
export function groupPopupHtml(points: MapPoint[], includesHome: boolean) {
  const labels = Array.from(new Set(points.map((point) => point.label)));
  const title =
    labels.length <= 2 ? labels.join(" · ") : `${labels[0]} and nearby`;

  const sections = CATEGORIES.map((category) => {
    const inCategory = points.filter((point) => point.category === category);
    if (!inCategory.length) return "";
    const items = inCategory.flatMap((point) =>
      point.items.map((item) => ({
        ...item,
        when:
          labels.length > 1 ? `${item.when} · ${point.label}` : item.when,
      })),
    );
    return `<li class="map-popup-section" data-category="${category}">
      <p class="map-popup-section-title">${CATEGORY_LABELS[category].section}<span>${items.length}</span></p>
      <ul>${rows(items)}</ul>
    </li>`;
  }).join("");

  return `<div class="map-popup-card" data-category="mixed">
    <header class="map-popup-head">
      <span class="map-popup-place">${escapeHtml(title)}</span>
    </header>
    ${includesHome ? '<p class="map-popup-home">Akash is based here</p>' : ""}
    <ul class="map-popup-list">${sections}</ul>
  </div>`;
}
