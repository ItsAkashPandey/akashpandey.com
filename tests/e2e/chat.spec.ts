import { test, expect } from "@playwright/test";

test.describe("Kasi chat", () => {
  test("Ask Kasi opens the panel with an input, and Escape closes it", async ({
    page,
  }) => {
    await page.goto("/");

    // A stable handle: its accessible name flips between "Ask Kasi" and
    // "Close Kasi" once clicked, so re-querying by name would miss it. The
    // home page has a second "start a chat" prompt with the same data
    // attribute, so this is scoped to the header's own button.
    const toggle = page.locator("header [data-kasi-toggle]");
    await expect(toggle).toHaveAccessibleName("Ask Kasi");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const input = page.getByRole("textbox", { name: "Message Kasi" });
    await expect(input).toBeVisible();

    // Focus something inside the panel so Escape is scoped to it, then close.
    await input.click();
    await page.keyboard.press("Escape");

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(input).toBeHidden();
  });
});
