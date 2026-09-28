import {
  createAdminSessionCookieValue,
  decodeAdminSessionCookieValue,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { sitePath } from "@/lib/utils";
import { scryptSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin credentials", () => {
  it("need the username and the password", () => {
    vi.stubEnv("ADMIN_USERNAME", "akash");
    vi.stubEnv("ADMIN_PASSWORD", "correct horse");
    expect(verifyAdminCredentials("akash", "correct horse")).toBe(true);
    expect(verifyAdminCredentials("akash", "correct hors")).toBe(false);
    expect(verifyAdminCredentials("someone", "correct horse")).toBe(false);
    expect(verifyAdminCredentials("", "")).toBe(false);
  });

  it("can be checked against a scrypt hash", () => {
    const hash = scryptSync("s3cret", "salt", 64).toString("hex");
    vi.stubEnv("ADMIN_USERNAME", "akash");
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("ADMIN_PASSWORD_HASH", `scrypt:salt:${hash}`);
    expect(verifyAdminCredentials("akash", "s3cret")).toBe(true);
    expect(verifyAdminCredentials("akash", "wrong")).toBe(false);
    expect(verifyAdminCredentials("someone", "s3cret")).toBe(false);
  });

  it("let nobody in when nothing is configured", () => {
    vi.stubEnv("ADMIN_USERNAME", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("ADMIN_PASSWORD_HASH", "");
    expect(verifyAdminCredentials("", "")).toBe(false);
  });
});

describe("admin sessions", () => {
  it("accept their own cookie and nothing edited or signed elsewhere", () => {
    vi.stubEnv("ADMIN_PASSWORD", "correct horse");
    const secret = "s".repeat(32);
    const cookie = createAdminSessionCookieValue("akash", secret);
    expect(decodeAdminSessionCookieValue(cookie, secret)?.username).toBe(
      "akash",
    );

    const [payload, signature] = cookie.split(".");
    const longer = Buffer.from(
      JSON.stringify({ u: "akash", exp: 9_999_999_999 }),
    ).toString("base64url");
    expect(
      decodeAdminSessionCookieValue(`${longer}.${signature}`, secret),
    ).toBeNull();
    expect(
      decodeAdminSessionCookieValue(`${payload}.${signature}x`, secret),
    ).toBeNull();
    expect(decodeAdminSessionCookieValue(cookie, "t".repeat(32))).toBeNull();
    expect(decodeAdminSessionCookieValue(cookie, "")).toBeNull();
  });
});

describe("sitePath", () => {
  it("keeps paths on this site", () => {
    expect(sitePath("/admin")).toBe("/admin");
    expect(sitePath("/activities/x?y=1#z")).toBe("/activities/x?y=1#z");
  });

  it("refuses anything that leads off the site", () => {
    for (const href of [
      "//example.com",
      "/\\example.com",
      "/\t/example.com",
      "https://example.com/admin",
      "javascript:alert(1)",
    ]) {
      expect(sitePath(href)).toBeNull();
    }
  });
});
