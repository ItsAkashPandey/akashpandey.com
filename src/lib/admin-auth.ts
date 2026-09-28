import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createHash,
  createHmac,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const COOKIE_NAME = "admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

/**
 * Compares hashes rather than the strings, so the time taken says nothing
 * about the length of the secret either (a length check used to return
 * early).
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

function verifyScryptPassword(password: string, encodedHash: string): boolean {
  const [scheme, salt, expectedHash] = encodedHash.split(":");
  if (scheme !== "scrypt" || !salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeStringEqual(actualHash, expectedHash);
}

/** Empty when unconfigured, which makes every session check fail closed. */
export function getAdminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ""
  );
}

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || "";
}

/**
 * What is missing from the admin setup, if anything. Checked before a login
 * is accepted: a login with no session secret used to "succeed" and then
 * bounce straight back to the login page with no explanation.
 */
export function adminConfigProblem(): string | null {
  if (!getAdminUsername()) return "ADMIN_USERNAME is not set.";
  if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) {
    return "ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) is not set.";
  }
  if (!getAdminSessionSecret()) return "ADMIN_SESSION_SECRET is not set.";
  return null;
}

/** Short secrets still work, but are worth replacing. */
export function adminSecretIsWeak() {
  return getAdminSessionSecret().length < 32;
}

/**
 * Credentials live only in the environment — there is deliberately no baked-in
 * fallback, so a misconfigured deploy locks admin out rather than shipping a
 * known password in the repository.
 */
export function verifyAdminCredentials(
  username: string,
  password: string,
): boolean {
  const expectedUsername = getAdminUsername();
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUsername || (!expectedPassword && !expectedHash)) return false;

  // Both are always checked: returning on a wrong username skipped the
  // (slow, with a hash) password check and told a guesser which one was
  // wrong.
  const usernameMatches = timingSafeStringEqual(username, expectedUsername);
  const passwordMatches = expectedPassword
    ? timingSafeStringEqual(password, expectedPassword)
    : verifyScryptPassword(password, expectedHash!);
  return usernameMatches && passwordMatches;
}

/**
 * Sessions are stateless cookies, so revoking them means changing the key
 * they are signed with. The key mixes in the password and
 * ADMIN_SESSION_VERSION: changing either (or the secret) signs every existing
 * session out, on every device.
 */
function signingKey(secret: string) {
  const credential = createHash("sha256")
    .update(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || "")
    .digest("hex");
  return createHmac("sha256", secret)
    .update(
      `admin-session:${credential}:${process.env.ADMIN_SESSION_VERSION ?? "1"}`,
    )
    .digest();
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", signingKey(secret))
    .update(payloadB64)
    .digest("base64url");
}

export function createAdminSessionCookieValue(
  username: string,
  secret: string,
): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payloadB64 = Buffer.from(JSON.stringify({ u: username, exp })).toString(
    "base64url",
  );
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function decodeAdminSessionCookieValue(
  value: string,
  secret: string,
): { username: string; exp: number } | null {
  if (!secret) return null;
  const [payloadB64, signatureB64, extra] = value.split(".");
  if (!payloadB64 || !signatureB64 || extra !== undefined) return null;

  if (!timingSafeStringEqual(signatureB64, sign(payloadB64, secret)))
    return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8"),
    ) as { u?: string; exp?: number };

    if (!payload?.u || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: payload.u, exp: payload.exp };
  } catch {
    return null;
  }
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export const ADMIN_SESSION_MAX_AGE = SESSION_SECONDS;

/** The signed-in admin, or null. For pages and route handlers. */
export async function readAdminSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return value
    ? decodeAdminSessionCookieValue(value, getAdminSessionSecret())
    : null;
}

/** A 401 response when there is no valid admin session, otherwise null. */
export async function requireAdminSession(): Promise<NextResponse | null> {
  return (await readAdminSession())
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
