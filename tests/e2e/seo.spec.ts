import { test, expect } from "@playwright/test";

test.describe("SEO endpoints", () => {
  test("sitemap.xml lists activities and image entries", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain("/activities/");
    expect(body).toContain("<image:loc>");
  });

  test("robots.txt disallows admin and api", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain("Disallow: /admin/");
    expect(body).toContain("Disallow: /api/");
  });

  test("activities feed is RSS with items", async ({ request }) => {
    const response = await request.get("/activities/feed.xml");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<item>");
  });

  test("llms.txt starts with the expected heading", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body.startsWith("# Dr. Akash Kumar")).toBe(true);
  });

  test("opengraph-image returns an image", async ({ request }) => {
    const response = await request.get("/opengraph-image");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image");
  });

  test("home response sends a locked-down CSP", async ({ request }) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
  });
});
