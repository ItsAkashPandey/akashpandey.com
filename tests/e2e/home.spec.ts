import { test, expect } from "@playwright/test";

test.describe("home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("title, h1 and the name it should never show", async ({ page }) => {
    await expect(page).toHaveTitle(/Dr\. Akash Kumar/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "hi, akash here",
    );
    await expect(page.locator("body")).not.toContainText("Akash Kumar Pandey");
  });

  test("places along the way: tour counter and city advance on Next place", async ({
    page,
  }) => {
    const section = page.locator("section", {
      hasText: "places along the way",
    });
    const heading = section.getByRole("heading", {
      name: "places along the way",
      level: 2,
    });
    await expect(heading).toBeVisible();
    await heading.scrollIntoViewIfNeeded();

    const counter = section.getByText(/^\d+ \/ \d+$/);
    await expect(counter).toHaveText("1 / 22");

    const cityHeading = section.getByRole("heading", { level: 3 });
    const firstCity = (await cityHeading.textContent())?.trim() ?? "";

    await section.getByRole("button", { name: "Next place" }).click();

    await expect(counter).toHaveText("2 / 22");
    await expect(cityHeading).not.toHaveText(firstCity);
  });

  test("Person JSON-LD names Akash Kumar", async ({ page }) => {
    const scripts = page.locator('script[type="application/ld+json"]');
    const payloads = await scripts.allTextContents();
    const people = payloads
      .map((raw) => JSON.parse(raw))
      .filter((data) => data["@type"] === "Person");

    expect(people.length).toBeGreaterThan(0);
    expect(people.some((person) => person.name === "Akash Kumar")).toBe(true);
  });
});
