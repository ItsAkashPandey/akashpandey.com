import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "hal_admin_session";
const FALLBACK_ADMIN_USERNAME = "AkashWebsiteAdmin";
const FALLBACK_ADMIN_PASSWORD_HASH =
  "scrypt:admin-akashpandey-com-2026:9cdb0a5ebdd9236359e5567ea93957c65b4dfefb6da894295531c7829c550ffabaa860bdec6c0825926872ea639d894e78da51e66dfe8586d692f1953a1980bf";
const FALLBACK_SESSION_SECRET = `akashpandey-admin-session:${FALLBACK_ADMIN_PASSWORD_HASH}`;

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function verifyScryptPassword(password: string, encodedHash: string): boolean {
  const [scheme, salt, expectedHash] = encodedHash.split(":");
  if (scheme !== "scrypt" || !salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeStringEqual(actualHash, expectedHash);
}

export function getAdminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.REVALIDATE_SECRET ||
    process.env.CHAT_LOG_WEBHOOK_TOKEN ||
    process.env.GEMINI_API_KEY ||
    process.env.RESEND_API_KEY ||
    FALLBACK_SESSION_SECRET
  );
}

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || FALLBACK_ADMIN_USERNAME;
}

export function verifyAdminCredentials(
  username: string,
  password: string,
): boolean {
  if (!timingSafeStringEqual(username, getAdminUsername())) return false;

  if (process.env.ADMIN_PASSWORD) {
    return timingSafeStringEqual(password, process.env.ADMIN_PASSWORD);
  }

  return verifyScryptPassword(
    password,
    process.env.ADMIN_PASSWORD_HASH || FALLBACK_ADMIN_PASSWORD_HASH,
  );
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

function sign(payloadB64: string, secret: string): string {
  const sig = createHmac("sha256", secret).update(payloadB64).digest();
  return base64UrlEncode(sig);
}

export function createAdminSessionCookieValue(
  username: string,
  secret: string,
): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const payload = JSON.stringify({ u: username, exp });
  const payloadB64 = base64UrlEncode(payload);
  const signatureB64 = sign(payloadB64, secret);
  return `${payloadB64}.${signatureB64}`;
}

export function decodeAdminSessionCookieValue(
  value: string,
  secret: string,
): { username: string; exp: number } | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  const expectedSig = sign(payloadB64, secret);

  // timingSafeEqual requires equal lengths
  const a = Buffer.from(signatureB64);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      base64UrlDecodeToBuffer(payloadB64).toString("utf-8"),
    ) as {
      u?: string;
      exp?: number;
    };

    if (!payload?.u || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: payload.u, exp: payload.exp };
  } catch {
    return null;
  }
}

export function verifyAdminSessionCookieValue(
  value: string,
  secret: string,
): boolean {
  return Boolean(decodeAdminSessionCookieValue(value, secret));
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}
