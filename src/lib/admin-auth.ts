import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "hal_admin_session";

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

export function createAdminSessionCookieValue(username: string, secret: string): string {
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
    const payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString("utf-8")) as {
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

export function verifyAdminSessionCookieValue(value: string, secret: string): boolean {
  return Boolean(decodeAdminSessionCookieValue(value, secret));
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}
