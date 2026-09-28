export type MarkerCategory = "activity" | "education" | "experience";

export type LngLat = [longitude: number, latitude: number];

/** One line in a map popup, linking to where the site covers it. */
export type MapItem = {
  title: string;
  /** "Jul 2026", or "Jul 2022 – Jul 2026" for a role. */
  when: string;
  href: string;
};

/** Everything of one category at one place. */
export type MapPoint = {
  id: string;
  category: MarkerCategory;
  /** The key in places.json. */
  place: string;
  coordinates: LngLat;
  /** The place's short name, e.g. "KVK Dhanauri, Haridwar". */
  label: string;
  /** For schools and employers: their own website. */
  website?: string;
  items: MapItem[];
};

export type MapData = {
  home: { coordinates: LngLat; label: string };
  points: MapPoint[];
};

export const CATEGORY_LABELS: Record<
  MarkerCategory,
  { one: string; many: string; section: string }
> = {
  activity: { one: "activity", many: "activities", section: "Activities" },
  education: { one: "programme", many: "programmes", section: "Education" },
  experience: { one: "role", many: "roles", section: "Work" },
};

export function countLabel(category: MarkerCategory, count: number) {
  const label = CATEGORY_LABELS[category];
  return `${count} ${count === 1 ? label.one : label.many}`;
}
