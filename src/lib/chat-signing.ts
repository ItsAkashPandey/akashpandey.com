import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { anyProviderKey } from "./chat-providers";

/**
 * The chat history comes back from the browser, where anyone can edit it.
 * Each of Kasi's replies is signed when it is sent, and on the next request
 * only replies whose signature still matches are passed to the model, so a
 * visitor cannot put words in Kasi's mouth.
 *
 * The key comes from CHAT_SIGNING_SECRET, or else from a secret the server
 * already has; it only needs to be stable and private.
 */
function signingKey() {
  const secret =
    process.env.CHAT_SIGNING_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    anyProviderKey();
  return secret
    ? createHash("sha256").update(`kasi-history:${secret}`).digest()
    : null;
}

function digest(key: Buffer, conversationId: string, content: string) {
  return createHmac("sha256", key)
    .update(conversationId)
    .update("\n")
    .update(content)
    .digest("base64url");
}

export function signReply(conversationId: string, content: string) {
  const key = signingKey();
  return key ? digest(key, conversationId, content) : undefined;
}

export function verifyReply(
  conversationId: string,
  content: string,
  signature: unknown,
) {
  const key = signingKey();
  if (!key || typeof signature !== "string") return false;
  const expected = Buffer.from(digest(key, conversationId, content));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
