import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activities",
  description:
    "Fieldwork, outreach, academic events, UAV mapping activities, and geospatial research highlights from Akash Kumar Pandey.",
  alternates: { canonical: "/activities" },
};

export default function ActivitiesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
