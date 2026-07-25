"use client";

import { sendEmail } from "@/lib/actions";
import { ContactFormSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaperPlaneIcon, ReloadIcon } from "@radix-ui/react-icons";
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
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="pointer-events-none absolute -left-[9999px] opacity-0"
        aria-hidden
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="h-16">
          <Input
            id="name"
            type="text"
            placeholder="Name"
            autoComplete="given-name"
            {...register("name")}
          />
          {errors.name?.message && (
            <p className="input-error">{errors.name.message}</p>
          )}
        </div>

        <div className="h-16">
          <Input
            id="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="input-error">{errors.email.message}</p>
          )}
        </div>

        <div className="h-32 sm:col-span-2">
          <Textarea
            rows={4}
            placeholder="Drop your message here."
            autoComplete="off"
            className="resize-none"
            {...register("message")}
          />
          {errors.message?.message && (
            <p className="input-error">{errors.message.message}</p>
          )}
        </div>
      </div>

      <div className="mt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full disabled:opacity-50"
        >
          <span className="flex items-center">
            <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
            {isSubmitting ? (
              <ReloadIcon className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <PaperPlaneIcon className="ml-2" />
            )}
          </span>
        </Button>
        <p className="text-muted-foreground mt-4 text-xs">
          By submitting this form, I agree to the{" "}
          <Link href="/privacy" className="link font-semibold">
            privacy&nbsp;policy.
          </Link>
        </p>
      </div>
    </form>
  );
}
