/**
 * Every icon name the JSON data may use. The schemas validate against this
 * list, so a misspelt name fails the build instead of crashing the page.
 */
export const ICON_NAMES = [
  "book",
  "circle-user-round",
  "file-text",
  "flask-conical",
  "github",
  "globe",
  "graduation-cap",
  "linkedin",
  "mail",
  "youtube",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
