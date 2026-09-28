import { test, expect } from "@playwright/test";

test.describe("search palette", () => {
  test("Enter opens the best match, even for a query pasted in whole", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search the site" }).click();
    const input = page.getByPlaceholder("Search activities, papers, tools…");

    // "Vienna" also matches the home page's description letter by letter;
    // the activity in Vienna has to come first.
    await input.fill("Vienna");
    await expect(page.locator("[cmdk-item][data-selected=true]")).toContainText(
      "EGU General Assembly 2026",
    );
    await input.press("Enter");
    await expect(page).toHaveURL(/\/activities\/egu-general-assembly-2026$/);
  });

  test("shows ⌘K on a Mac", async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(Navigator.prototype, "platform", {
        get: () => "MacIntel",
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Search the site" }).click();
    await expect(page.getByText("from anywhere")).toContainText("⌘K");
  });
});
