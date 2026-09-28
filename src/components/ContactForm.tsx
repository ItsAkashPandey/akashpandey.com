"use client";

import { sendEmail } from "@/lib/actions";
import { ContactFormSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

type Inputs = z.infer<typeof ContactFormSchema>;

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const honeypotRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(0);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const renderTurnstile = () => {
    const turnstile = (window as unknown as { turnstile?: Turnstile })
      .turnstile;
    if (!turnstile || !turnstileRef.current || widgetIdRef.current) return;
    widgetIdRef.current = turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "auto",
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
    });
  };

  const handleFormSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const result = await sendEmail(data, {
        website: honeypotRef.current?.value,
        startedAt: startedAtRef.current,
        turnstileToken,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Message sent. Thanks! I'll get back to you soon.");
      reset();
      startedAtRef.current = Date.now();
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      if (widgetIdRef.current) {
        (window as unknown as { turnstile?: Turnstile }).turnstile?.reset(
          widgetIdRef.current,
        );
        setTurnstileToken("");
      }
    }
  };

  const fieldError = (name: keyof Inputs) =>
    errors[name]?.message ? (
      <p id={`${name}-error`} className="input-error" role="alert">
        {errors[name]?.message}
      </p>
    ) : null;

  const describedBy = (name: keyof Inputs) =>
    errors[name]
      ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
      : {};

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="contact-surface record-surface relative"
      noValidate
    >
      {/* Invisible to people and screen readers; bots fill it in. */}
      <input
        ref={honeypotRef}
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
            autoComplete="name"
            className="bg-background/55 h-11"
            {...describedBy("name")}
            {...register("name")}
          />
          {fieldError("name")}
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
            {...describedBy("email")}
            {...register("email")}
          />
          {fieldError("email")}
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
            className="ios-prevent-zoom bg-background/55 min-h-36 resize-y"
            {...describedBy("message")}
            {...register("message")}
          />
          {fieldError("message")}
        </div>
      </div>

      {TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="lazyOnload"
            onReady={renderTurnstile}
          />
          <div ref={turnstileRef} className="mt-4 min-h-[65px]" />
        </>
      )}

      <div className="border-border/60 mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          By sending this, you agree to the{" "}
          <Link href="/privacy" className="link font-semibold">
            privacy&nbsp;policy
          </Link>
          .
        </p>
        <Button
          type="submit"
          disabled={
            isSubmitting || Boolean(TURNSTILE_SITE_KEY && !turnstileToken)
          }
          className="h-11 w-full px-6 disabled:opacity-50 sm:w-auto sm:min-w-44"
        >
          <span className="flex items-center gap-2">
            <span>{isSubmitting ? "Sending..." : "Send message"}</span>
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
