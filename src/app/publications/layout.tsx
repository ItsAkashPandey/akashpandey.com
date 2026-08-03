import publicationsData from "@/data/publications.json";
import { jsonLdProps, publicationsSchema } from "@/lib/structured-data";
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
  return (
    <>
      {/* The papers are the strongest thing on this domain. Marked up, each one
          is indexable in its own right rather than being anonymous body copy. */}
      <script
        {...jsonLdProps(publicationsSchema(publicationsData.publications))}
      />
      {children}
    </>
  );
}
