import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How this site handles Kasi chat messages, contact form messages, map location permission, and theme preferences.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
