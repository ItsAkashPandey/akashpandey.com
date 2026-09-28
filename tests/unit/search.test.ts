import {
  slugFromHash,
  type ActivityListItem,
} from "@/components/ProgressiveActivitiesList";
import { getActivities } from "@/lib/content";
import { getHighlightTerms } from "@/lib/search";
import { describe, expect, it } from "vitest";

describe("getHighlightTerms", () => {
  it("marks words found through the one-typo match", () => {
    const terms = getHighlightTerms("phenocm", "Installing a PhenoCam at KVK");
    expect(terms).toContain("phenocam");
  });

  it("returns nothing for an empty query", () => {
    expect(getHighlightTerms("  ", "text")).toEqual([]);
  });
});

describe("activity deep links", () => {
  const activities = getActivities() as ActivityListItem[];

  it("accepts a permanent slug", () => {
    expect(slugFromHash("#nasa-space-apps-2024", activities)).toBe(
      "nasa-space-apps-2024",
    );
  });

  it("maps the old #activity-N links onto slugs", () => {
    expect(slugFromHash("#activity-0", activities)).toBe(activities[0].slug);
    expect(slugFromHash("#activity-20", activities)).toBe(activities[20].slug);
  });

  it("ignores hashes that are not activities", () => {
    expect(slugFromHash("#nope", activities)).toBeNull();
    expect(slugFromHash("", activities)).toBeNull();
  });
});
