import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How this portfolio handles KASI chat, contact messages, OpenFreeMap tiles, CelesTrak orbital data, location permission, and theme preferences.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
