import { getActivities, getPublications } from "@/lib/content";
import { buildSearchIndex, SEARCH_GROUPS } from "@/lib/search-index";
import { describe, expect, it } from "vitest";

describe("buildSearchIndex", () => {
  const index = buildSearchIndex();

  it("covers every activity and paper", () => {
    const hrefs = new Set(index.map((entry) => entry.href));
    for (const activity of getActivities()) {
      expect(hrefs).toContain(`/activities/${activity.slug}`);
    }
    for (const publication of getPublications()) {
      expect(hrefs).toContain(`/publications/${publication.slug}`);
    }
  });

  it("only points inside the site", () => {
    for (const entry of index) {
      expect(entry.href.startsWith("/")).toBe(true);
      expect(entry.title.trim()).not.toBe("");
      expect(SEARCH_GROUPS).toContain(entry.group);
    }
  });

  it("has no duplicate rows", () => {
    const keys = index.map(
      (entry) => `${entry.group}|${entry.title}|${entry.detail}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("stays small enough to fetch on open", () => {
    expect(JSON.stringify(index).length).toBeLessThan(40_000);
  });
});
