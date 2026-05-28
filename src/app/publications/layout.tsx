import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Research publications by Akash Kumar Pandey in remote sensing, vegetation phenology, PhenoCam, UAV mapping, and geospatial analysis.",
  alternates: { canonical: "/publications" },
};

export default function PublicationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
