"use client";

import publicationsData from "@/data/publications.json";
import PublicationsWithSearch from "@/components/PublicationsWithSearch";

export default function PublicationsPage() {
  return (
    <article className="mt-8 flex flex-col gap-8 pb-16">
      <h1 className="title">my publications.</h1>
      <PublicationsWithSearch publications={publicationsData.publications as any} />
    </article>
  );
}
