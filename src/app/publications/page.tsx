import PublicationsWithSearch from "@/components/PublicationsWithSearch";
import { getPublications } from "@/lib/content";
import { toPublicationListItem } from "@/lib/publication-items";
import { jsonLdProps, publicationsSchema } from "@/lib/structured-data";

export default function PublicationsPage() {
  return (
    <article className="page-shell">
      <script {...jsonLdProps(publicationsSchema(getPublications()))} />
      <header className="page-heading">
        <h1 className="title">my publications.</h1>
        <p className="page-lede text-balance">
          Peer-reviewed journals, international conferences, book chapters, and
          active manuscripts across PhenoCam, crop phenology, UAV mapping, and
          satellite remote sensing.
        </p>
      </header>

      <PublicationsWithSearch
        publications={getPublications().map(toPublicationListItem)}
      />
    </article>
  );
}
