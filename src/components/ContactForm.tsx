"use client";

import { sendEmail } from "@/lib/actions";
import { ContactFormSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

type Inputs = z.infer<typeof ContactFormSchema>;

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const handleFormSubmit: SubmitHandler<Inputs> = async (data) => {
    const formElement = document.querySelector("form");
    const honeypot = formElement?.querySelector(
      'input[name="website"]',
    ) as HTMLInputElement;

    if (honeypot?.value) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    try {
      const result = await sendEmail(data);

      if (result.error) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "An error occurred! Please try again later.",
        );
        return;
      }

      toast.success("Message sent successfully!");
      reset();
    } catch (error) {
      console.error("Form processing error:", error);
      toast.error("Failed to connect to the email service. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="contact-surface record-surface"
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="pointer-events-none absolute -left-[9999px] opacity-0"
        aria-hidden
      />

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <div className="min-h-20">
          <label htmlFor="name" className="mb-2 block text-sm font-semibold">
            Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            autoComplete="given-name"
            className="bg-background/55 h-11"
            {...register("name")}
          />
          {errors.name?.message && (
            <p className="input-error">{errors.name.message}</p>
          )}
        </div>

        <div className="min-h-20">
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="bg-background/55 h-11"
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="input-error">{errors.email.message}</p>
          )}
        </div>

        <div className="min-h-44 sm:col-span-2">
          <label htmlFor="message" className="mb-2 block text-sm font-semibold">
            Message
          </label>
          <Textarea
            id="message"
            rows={4}
            placeholder="Drop your message here."
            autoComplete="off"
            className="bg-background/55 min-h-36 resize-none"
            {...register("message")}
          />
          {errors.message?.message && (
            <p className="input-error">{errors.message.message}</p>
          )}
        </div>
      </div>

      <div className="border-border/60 mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          By submitting this form, I agree to the{" "}
          <Link href="/privacy" className="link font-semibold">
            privacy&nbsp;policy.
          </Link>
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full px-6 disabled:opacity-50 sm:w-auto sm:min-w-44"
        >
          <span className="flex items-center gap-2">
            <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </span>
        </Button>
      </div>
    </form>
  );
}
