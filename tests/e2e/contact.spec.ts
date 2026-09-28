import { test, expect, type Page } from "@playwright/test";

// A 1×1 PNG for the imagery layer.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/**
 * Stand-ins for the map's tile servers (an empty vector source and plain
 * imagery), so the map loads the same way every time, with or without a
 * network.
 */
async function stubMapTiles(page: Page) {
  await page.route("https://tiles.openfreemap.org/planet", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        tilejson: "3.0.0",
        tiles: ["https://tiles.openfreemap.org/planet/stub/{z}/{x}/{y}.pbf"],
        minzoom: 0,
        maxzoom: 14,
      }),
    }),
  );
  await page.route(/tiles\.openfreemap\.org\/(planet\/stub|fonts)\//, (route) =>
    route.fulfill({ contentType: "application/x-protobuf", body: "" }),
  );
  await page.route("https://server.arcgisonline.com/**", (route) =>
    route.fulfill({ contentType: "image/png", body: PNG }),
  );
}

/** Whether the open popup sits entirely inside the map. */
function popupInsideMap(page: Page) {
  return page.evaluate(() => {
    const frame = document
      .querySelector("#map .maplibregl-map")
      ?.getBoundingClientRect();
    const popup = document
      .querySelector("#map .maplibregl-popup")
      ?.getBoundingClientRect();
    return Boolean(
      frame &&
      popup &&
      popup.top >= frame.top - 1 &&
      popup.bottom <= frame.bottom + 1,
    );
  });
}

test.describe("contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("submitting the empty form shows validation messages", async ({
    page,
  }) => {
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

test.describe("contact map", () => {
  test.beforeEach(async ({ page }) => {
    await stubMapTiles(page);
  });

  test("pins sit where the map puts them", async ({ page }) => {
    await page.goto("/contact");
    const pins = page.locator("#map .maplibregl-marker");
    await expect(pins.nth(2)).toBeAttached({ timeout: 30_000 });

    // MapLibre moves each pin into place with a transform. A position class
    // on the pins once put them in the normal flow instead, each one lower
    // than the last.
    const offsets = await pins.evaluateAll((elements) =>
      elements.map((element) => {
        const frame = element.parentElement!.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        const y = element.style.transform.match(
          /translate\([-\d.]+px, ([-\d.]+)px\)/,
        )?.[1];
        return Math.abs(box.top + box.height / 2 - frame.top - Number(y));
      }),
    );
    expect(Math.max(...offsets)).toBeLessThanOrEqual(1);
  });

  test("a link to a far-off city keeps the map in view and opens its popup", async ({
    page,
  }) => {
    await page.goto("/contact?city=vienna#map");

    await expect(page.locator("#map .maplibregl-popup")).toContainText(
      "EGU General Assembly 2026",
    );
    // The popup opens before the map has flown to Vienna, and focusing it
    // there used to scroll the page back to the top. Once the flight is over
    // the whole map should still be on screen.
    await expect
      .poll(() => popupInsideMap(page), { timeout: 15_000 })
      .toBe(true);
    await expect(page.locator("#map .maplibregl-map")).toBeInViewport({
      ratio: 1,
    });
  });

  test("a long popup from a link fits inside the map", async ({ page }) => {
    await page.goto("/contact?place=iit-roorkee#map");

    await expect(page.locator("#map .maplibregl-popup")).toContainText(
      "PhD Viva-Voce",
    );
    await expect
      .poll(() => popupInsideMap(page), { timeout: 15_000 })
      .toBe(true);
  });
});
