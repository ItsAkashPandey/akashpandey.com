import siteData from "@/data/site.json";
import socials from "@/data/socials.json";
import { getCareer, getEducation } from "@/lib/content";
import { publicationHref, splitAuthors } from "@/lib/content-utils";
import { getPhoto } from "@/lib/photos";
import type { Publication } from "@/lib/schemas";

const SITE = siteData.url;

function absolute(path: string) {
  return path.startsWith("http") ? path : `${SITE}${path}`;
}

/**
 * Search engines have no way to connect this site to the person it is about
 * unless the page says so in a form they parse. `sameAs` is the part that
 * matters most for a name query: it is how Google reconciles this domain with
 * the ORCID, Scholar, GitHub and LinkedIn profiles that already rank.
 */
export function personSchema() {
  const current = getCareer().flatMap((org) =>
    org.positions
      .filter((position) => position.end === "Present")
      .map((position) => ({ org, position })),
  );
  const portrait = getPhoto("/img/akash-4.webp");
  const image =
    portrait.hash && portrait.widths?.includes(640)
      ? `/_img/${portrait.hash}-640.webp`
      : portrait.src;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE}/#akash`,
    name: "Akash Kumar",
    honorificPrefix: "Dr.",
    alternateName: ["Dr. Akash Kumar", "Akash Pandey"],
    url: SITE,
    image: absolute(image),
    jobTitle: current.map(({ position }) => position.title),
    worksFor: current.map(({ org }) => ({
      "@type": "Organization",
      name: org.name,
      url: org.href,
    })),
    description:
      "Geospatial researcher working on crop and vegetation phenology with PhenoCam, UAV and satellite remote sensing.",
    alumniOf: getEducation().map((school) => ({
      "@type": "CollegeOrUniversity",
      name: school.name,
      url: school.href,
    })),
    hasCredential: getEducation().flatMap((school) =>
      school.positions
        .filter((position) => position.end && position.end !== "Present")
        .map((position) => ({
          "@type": "EducationalOccupationalCredential",
          name: position.title,
          credentialCategory: "degree",
          recognizedBy: { "@type": "CollegeOrUniversity", name: school.name },
        })),
    ),
    knowsAbout: [
      "Remote sensing",
      "Vegetation phenology",
      "PhenoCam",
      "UAV mapping",
      "Precision agriculture",
      "Google Earth Engine",
      "Geographic information systems",
      "Satellite image analysis",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Roorkee",
      addressRegion: "Uttarakhand",
      addressCountry: "IN",
    },
    sameAs: socials.socials
      .map((social) => social.href)
      .filter((href) => href.startsWith("http")),
  };
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: SITE,
  name: "Dr. Akash Kumar",
  inLanguage: "en",
  publisher: { "@id": `${SITE}/#akash` },
};

export const profilePageSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${SITE}/#profile`,
  url: SITE,
  mainEntity: { "@id": `${SITE}/#akash` },
  isPartOf: { "@id": `${SITE}/#website` },
};

/** One work per paper, typed by what it actually is. */
export function publicationSchema(publication: Publication) {
  const isChapter =
    publication.type === "Book" || publication.type === "Book Chapter";
  const container = publication.journal
    ? { "@type": "Periodical", name: publication.journal }
    : publication.book
      ? { "@type": "Book", name: publication.book }
      : publication.conference
        ? // Conference papers and abstracts sit in proceedings, not journals.
          { "@type": "CreativeWork", name: publication.conference }
        : null;

  return {
    "@type": isChapter ? "Chapter" : "ScholarlyArticle",
    "@id": `${SITE}${publicationHref(publication.slug)}`,
    name: publication.title,
    headline: publication.title,
    url: `${SITE}${publicationHref(publication.slug)}`,
    datePublished: String(publication.year),
    // His own name points at the Person above, so the papers attach to him.
    author: splitAuthors(publication.authors).map((name) =>
      name === "Akash Kumar"
        ? { "@type": "Person", "@id": `${SITE}/#akash`, name }
        : { "@type": "Person", name },
    ),
    ...(container ? { isPartOf: container } : {}),
    ...(publication.publisher
      ? { publisher: { "@type": "Organization", name: publication.publisher } }
      : {}),
    ...(publication.status !== "Published"
      ? { creativeWorkStatus: publication.status }
      : {}),
    ...(publication.doi || publication.preprint
      ? { sameAs: [publication.doi, publication.preprint].filter(Boolean) }
      : {}),
  };
}

export function publicationsSchema(publications: Publication[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Publications by Dr. Akash Kumar",
    itemListElement: publications.map((publication, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: publicationSchema(publication),
    })),
  };
}

/** Home › Section › Page, for the trail search results show under the title. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}

/**
 * Inlined as a <script>. `<` is escaped so a title containing "</script>"
 * could never close the tag early.
 */
export function jsonLdProps(schema: unknown) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
    },
  } as const;
}
