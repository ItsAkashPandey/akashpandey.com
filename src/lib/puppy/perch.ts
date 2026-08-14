/**
 * Surface detection for the desktop pet.
 *
 * The dog can stand on any visible element edge — headings, images, cards,
 * buttons, nav bars, input fields, borders, dividers, the chat window, code
 * blocks, photo carousels, and more. The page IS the furniture.
 */

const SURFACES = [
  // Explicit perch markers
  "[data-puppy-perch]",
  "[data-kasi-window]",
  // Headings
  "h1", "h2", "h3", "h4", "h5", "h6",
  // Structural
  "header", "nav", "footer", "aside",
  // Content
  ".record-surface", ".paper-band", ".model-plate",
  "img", "figure", "figcaption",
  "table", "thead", "th",
  "blockquote", "pre", "code",
  // Interactive
  "button", "a[href]",
  "input", "textarea", "select",
  // Cards & containers
  "article", "section > div",
  ".card", "[class*='card']",
  // UI components  
  "hr", "[role='separator']",
  "[role='tablist']", "[role='tab']",
  "[role='banner']", "[role='navigation']",
  // Paragraphs in articles
  "article > p",
  // Photo galleries & carousels
  "[class*='carousel']", "[class*='slider']", "[class*='gallery']",
  "[class*='swiper']",
  // Borders & dividers
  "[class*='divider']", "[class*='separator']",
  // Skill/tag badges
  "[class*='badge']", "[class*='chip']", "[class*='tag']",
  // Any element with visible border
  "li",
].join(",");

/** Minimum dimensions for a usable surface */
const MIN_WIDTH = 32;
const MIN_HEIGHT = 8;

export type Perch = {
  element: HTMLElement;
  /** Where along the surface the dog stands, 0 at left, 1 at right. */
  ratio: number;
};

export type Landing = {
  y: number;
  perch: Perch | null;
};

function usable(rect: DOMRect) {
  return rect.width >= MIN_WIDTH && rect.height >= MIN_HEIGHT;
}

/**
 * Find the nearest surface below the dog's current position.
 * Returns floor of viewport when over open space.
 */
export function findLanding(
  x: number,
  feetY: number,
  ignore: Element,
): Landing {
  const floor = window.innerHeight;
  let best: { top: number; element: HTMLElement; rect: DOMRect } | null = null;

  for (const candidate of document.querySelectorAll<HTMLElement>(SURFACES)) {
    if (candidate === ignore || candidate.contains(ignore)) continue;
    // Skip invisible elements
    const style = window.getComputedStyle(candidate);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

    const rect = candidate.getBoundingClientRect();
    if (!usable(rect)) continue;
    if (x < rect.left - 4 || x > rect.right + 4) continue;
    if (rect.top < feetY + 1) continue;
    if (rect.top > floor) continue;

    if (!best || rect.top < best.top) {
      best = { top: rect.top, element: candidate, rect };
    }
  }

  if (!best) return { y: floor, perch: null };

  return {
    y: best.top,
    perch: {
      element: best.element,
      ratio: Math.max(0.05, Math.min(0.95, (x - best.rect.left) / best.rect.width)),
    },
  };
}

/**
 * Find the nearest surface at any direction from the dog's position.
 * Used for the dog to jump to nearby surfaces.
 */
export function findNearbySurface(
  x: number,
  y: number,
  ignore: Element,
  maxDistance = 300,
): Landing | null {
  let best: { dist: number; top: number; element: HTMLElement; rect: DOMRect } | null = null;

  for (const candidate of document.querySelectorAll<HTMLElement>(SURFACES)) {
    if (candidate === ignore || candidate.contains(ignore)) continue;
    const style = window.getComputedStyle(candidate);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const rect = candidate.getBoundingClientRect();
    if (!usable(rect)) continue;
    if (rect.top < 0 || rect.top > window.innerHeight) continue;

    const cx = rect.left + rect.width / 2;
    const dist = Math.hypot(cx - x, rect.top - y);
    if (dist > maxDistance) continue;
    if (dist < 20) continue; // too close, probably the current perch

    if (!best || dist < best.dist) {
      best = { dist, top: rect.top, element: candidate, rect };
    }
  }

  if (!best) return null;

  return {
    y: best.top,
    perch: {
      element: best.element,
      ratio: Math.max(0.1, Math.min(0.9, (x - best.rect.left) / best.rect.width)),
    },
  };
}

/**
 * Re-reads a perch after scroll or resize. Null means gone.
 */
export function readPerch(perch: Perch): { x: number; y: number } | null {
  if (!perch.element.isConnected) return null;

  const rect = perch.element.getBoundingClientRect();
  if (!usable(rect)) return null;
  if (rect.top < -60 || rect.top > window.innerHeight + 60) return null;

  return { x: rect.left + rect.width * perch.ratio, y: rect.top };
}
