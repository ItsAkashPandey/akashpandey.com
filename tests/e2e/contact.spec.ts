import { test, expect } from "@playwright/test";

test.describe("contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("submitting the empty form shows validation messages", async ({ page }) => {
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByText("Name is required.")).toBeVisible();
    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Message is required.")).toBeVisible();
  });

  test("the map section exists", async ({ page }) => {
    await expect(page.locator("#map")).toBeAttached();
  });

  test("the map shows a canvas or its loading/error state", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");

    const map = page.locator("#map");
    await map.scrollIntoViewIfNeeded();

    const ready = map.locator("canvas");
    const tryAgain = map.getByRole("button", { name: "Try again" });
    await expect(ready.first().or(tryAgain)).toBeVisible({ timeout: 30_000 });
  });
});
