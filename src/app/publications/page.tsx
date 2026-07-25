"use client";

import publicationsData from "@/data/publications.json";
import PublicationsWithSearch from "@/components/PublicationsWithSearch";

export default function PublicationsPage() {
  const publications = publicationsData.publications as any[];

  return (
    <article className="page-shell">
      <header className="page-heading">
        <h1 className="title">my publications.</h1>
        <p className="page-lede text-balance">
          Peer-reviewed journals, international conferences, book chapters, and
          active manuscripts across PhenoCam, crop phenology, UAV mapping, and
          satellite remote sensing.
        </p>
      </header>

      <PublicationsWithSearch publications={publications as any} />
    </article>
  );
}
