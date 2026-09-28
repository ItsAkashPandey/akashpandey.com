import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** A stand-in origin for telling this site's paths from other URLs. */
const SITE_ORIGIN = "https://site.invalid";

/**
 * `href` as a path on this site, or null if it leads anywhere else. Parsed
 * the way the browser will read it: "//host" and "/\host" start with a slash
 * too, and tabs or newlines hidden in between are dropped by the browser.
 */
export function sitePath(href: string): string | null {
  try {
    const url = new URL(href, SITE_ORIGIN);
    return url.origin === SITE_ORIGIN
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}
