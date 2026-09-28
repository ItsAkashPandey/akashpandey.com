"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";
import { getClientIp, isRateLimited } from "./rate-limit";
import { ContactFormSchema } from "./schemas";

type ContactFormInputs = z.infer<typeof ContactFormSchema>;

type SpamSignals = {
  /** The hidden "website" field. People never see it; bots fill it in. */
  website?: string;
  /** When the form was rendered, in ms. Scripts submit instantly. */
  startedAt?: number;
  /** Cloudflare Turnstile response, when the site key is configured. */
  turnstileToken?: string;
};

type Result = { success: true } | { error: string };

const FALLBACK_ERROR =
  "The message could not be sent right now. Please email akash_k@ce.iitr.ac.in instead.";

async function passesTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token, remoteip: ip }),
        signal: AbortSignal.timeout(5000),
      },
    );
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export async function sendEmail(
  data: ContactFormInputs,
  signals: SpamSignals = {},
): Promise<Result> {
  // Filled honeypot: act as if it worked, so the bot has nothing to learn.
  if (signals.website) return { success: true };

  if (signals.startedAt && Date.now() - signals.startedAt < 2500) {
    return { error: "That was quick. Give it a second and send again." };
  }

  const ip = getClientIp(await headers());
  if (await isRateLimited("contact", ip, 3, 10 * 60_000)) {
    return {
      error:
        "Too many messages from this connection. Please try again later, or email akash_k@ce.iitr.ac.in.",
    };
  }

  if (!(await passesTurnstile(signals.turnstileToken, ip))) {
    return { error: "Please complete the spam check and try again." };
  }

  const parsed = ContactFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Please check the name, email and message fields." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not set.");
    return { error: FALLBACK_ERROR };
  }

  // Resend's shared test sender only delivers to the Resend account owner
  // and tends to land in spam. Verify akashpandey.com in Resend and set
  // CONTACT_FROM_EMAIL (e.g. "Website <contact@akashpandey.com>").
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!from) {
    console.warn(
      "[contact] CONTACT_FROM_EMAIL is not set; using onboarding@resend.dev, which only reaches the Resend account owner.",
    );
  }

  const { name, email, message } = parsed.data;
  try {
    const { data: sent, error } = await new Resend(apiKey).emails.send({
      from: from || "Website contact <onboarding@resend.dev>",
      to: process.env.CONTACT_TO_EMAIL || "akash_k@ce.iitr.ac.in",
      replyTo: email,
      subject: `New message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\n(Sent from the contact form on akashpandey.com)`,
    });

    if (!sent || error) {
      console.error("[contact] Resend error:", error);
      return { error: FALLBACK_ERROR };
    }
    return { success: true };
  } catch (error) {
    console.error("[contact] send failed:", error);
    return { error: FALLBACK_ERROR };
  }
}
