import { test, expect } from "@playwright/test";

test.describe("publications", () => {
  test("the list renders", async ({ page }) => {
    await page.goto("/publications");
    await expect(
      page.getByRole("heading", { name: "my publications.", level: 1 }),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/publications/wheat-phenology-phenocam-2026"]').first(),
    ).toBeVisible();
  });

  test("a detail page has citation metadata and a DOI link", async ({ page }) => {
    await page.goto("/publications/wheat-phenology-phenocam-2026");

    const citationTitle = page.locator('meta[name="citation_title"]');
    await expect(citationTitle).toHaveAttribute(
      "content",
      /Wheat Crop Phenology/i,
    );

    const doiLink = page.locator('a[href*="doi.org"]');
    await expect(doiLink.first()).toBeVisible();
  });
});
