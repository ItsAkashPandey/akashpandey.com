"use server";

import ContactFormEmail from "@/components/email/ContactFormEmail";
import { Resend } from "resend";
import { z } from "zod";
import { ContactFormSchema } from "./schemas";

type ContactFormInputs = z.infer<typeof ContactFormSchema>;

export async function sendEmail(data: ContactFormInputs) {
  console.log("sendEmail Server Action triggered with data:", { ...data, message: data.message?.substring(0, 20) + "..." });

  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in environment!");
    return { error: "Email service is not configured (missing API key)." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
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
