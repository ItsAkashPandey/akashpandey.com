"use server";

import ContactFormEmail from "@/components/email/ContactFormEmail";
import { Resend } from "resend";
import { z } from "zod";
import { ContactFormSchema } from "./schemas";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not defined in environment variables!");
}

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactFormInputs = z.infer<typeof ContactFormSchema>;

export async function sendEmail(data: ContactFormInputs) {
  if (!process.env.RESEND_API_KEY) {
    return { error: "Email service is not configured (missing API key)." };
  }
  const result = ContactFormSchema.safeParse(data);

  if (result.error) {
    return { error: result.error.format() };
  }

  try {
    const { name, email, message } = result.data;
    const { data, error } = await resend.emails.send({
      from: `onboarding@resend.dev`,
      to: "akash_k@ce.iitr.ac.in",
      replyTo: [email],
      subject: `New message from ${name}!`,
      text: `Name:\n${name}\n\nEmail:\n${email}\n\nMessage:\n${message}`,
      // react: ContactFormEmail({ name, email, message }),
    });

    if (!data || error) {
      const errorMsg = error?.message || "Unknown Resend error";
      console.error("Resend Error:", errorMsg, error);
      return { error: errorMsg };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Catch Error in sendEmail:", err);
    return { error: err.message || "An unexpected error occurred" };
  }
}
