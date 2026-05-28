import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Technical skills, instruments, software, and field tools used by Akash Kumar Pandey across UAVs, surveying, GIS, remote sensing, and civil engineering.",
  alternates: { canonical: "/skills" },
};

export default function SkillsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
