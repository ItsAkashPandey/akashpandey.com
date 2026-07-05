"use client";

import publicationsData from "@/data/publications.json";
import PublicationsWithSearch from "@/components/PublicationsWithSearch";

export default function PublicationsPage() {
  const publications = publicationsData.publications as any[];

  return (
    <article className="mt-10 flex flex-col gap-8 pb-16">
      <section className="flex max-w-3xl flex-col gap-3">
        <h1 className="title">my publications.</h1>
        <p className="text-muted-foreground text-base leading-relaxed text-balance sm:text-lg">
          Peer-reviewed journals, international conferences, book chapters, and
          active manuscripts across PhenoCam, crop phenology, UAV mapping, and
          satellite remote sensing.
        </p>
      </section>

      <PublicationsWithSearch publications={publications as any} />
    </article>
  );
}
