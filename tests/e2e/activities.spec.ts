import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Read as plain JSON (rather than an ESM import) so this file doesn't need
// an import-attribute for a path that sits outside the app's own module graph.
const activitiesData = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "../../src/data/activities.json"),
    "utf-8",
  ),
) as { activities: { slug: string; date: string }[] };

// Same order the site builds the list in: newest first by date.
const newestSlug = [...activitiesData.activities].sort((a, b) =>
  b.date.localeCompare(a.date),
)[0].slug;

test.describe("activities", () => {
  test("a direct hash lands on that activity", async ({ page }) => {
    await page.goto("/activities#nasa-space-apps-2024");
    await expect(page.locator("#nasa-space-apps-2024")).toBeInViewport();
  });

  test("the legacy #activity-0 hash lands on the newest activity", async ({
    page,
  }) => {
    await page.goto("/activities#activity-0");
    await expect(page.locator(`#${newestSlug}`)).toBeInViewport();
  });

  test("typing in the search box updates the URL", async ({ page }) => {
    await page.goto("/activities");
    await page.getByRole("searchbox", { name: "Search" }).fill("phenocam");
    await expect(page).toHaveURL(/[?&]q=phenocam/);
  });

  test("an activity detail page has a heading, an image and its JSON-LD", async ({
    page,
  }) => {
    await page.goto("/activities/phd-viva-voce-2026");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "PhD Viva-Voce",
    );
    await expect(page.locator("img").first()).toBeVisible();

    const payloads = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const types = payloads.map((raw) => JSON.parse(raw)["@type"]);
    expect(types).toContain("Event");
    expect(types).toContain("BreadcrumbList");
  });

  test("an unknown activity slug 404s", async ({ page }) => {
    const response = await page.goto("/activities/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
