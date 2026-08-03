import siteData from "@/data/site.json";

const SITE = siteData.url;

/**
 * Search engines have no way to connect this site to the person it is about
 * unless the page says so in a form they parse. `sameAs` is the part that
 * matters most for a name query: it is how Google reconciles this domain with
 * the ORCID, Scholar, GitHub and LinkedIn profiles that already rank, and
 * treats them as one entity rather than four strangers.
 */
export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE}/#akash`,
  name: "Akash Kumar Pandey",
  alternateName: ["Akash Kumar", "Akash Pandey"],
  url: SITE,
  image: `${SITE}/img/akash-4.webp`,
  jobTitle: "Geospatial Researcher",
  description:
    "Geospatial researcher working on vegetation phenology with PhenoCam, UAV and satellite remote sensing.",
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "Indian Institute of Technology Roorkee",
    url: "https://www.iitr.ac.in/",
  },
  alumniOf: [
    {
      "@type": "CollegeOrUniversity",
      name: "Maulana Azad National Institute of Technology Bhopal",
    },
    {
      "@type": "CollegeOrUniversity",
      name: "Meerut Institute of Engineering and Technology",
    },
  ],
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
  sameAs: [
    "https://www.linkedin.com/in/iamakashpandey/",
    "https://github.com/ItsAkashPandey",
    "https://orcid.org/0009-0009-0757-6276",
    "https://scholar.google.com/citations?user=wg6rG0cAAAAJ&hl=en",
    "https://www.researchgate.net/profile/Akash-Kumar-251",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: SITE,
  name: "Akash Kumar Pandey",
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

type PublicationLike = {
  title: string;
  authors: string;
  year: number;
  type: string;
  journal?: string;
  conference?: string;
  book?: string;
  publisher?: string;
  doi?: string;
};

/** One ScholarlyArticle per paper, so the work itself is indexable. */
export function publicationsSchema(publications: PublicationLike[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Publications by Akash Kumar Pandey",
    itemListElement: publications.map((publication, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type":
          publication.type === "Book" || publication.type === "Book Chapter"
            ? "Chapter"
            : "ScholarlyArticle",
        name: publication.title,
        datePublished: String(publication.year),
        author: publication.authors
          .split(/,| and /)
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ "@type": "Person", name })),
        ...(publication.journal || publication.conference || publication.book
          ? {
              isPartOf: {
                "@type": "Periodical",
                name:
                  publication.journal ??
                  publication.conference ??
                  publication.book,
              },
            }
          : {}),
        ...(publication.publisher
          ? {
              publisher: {
                "@type": "Organization",
                name: publication.publisher,
              },
            }
          : {}),
        ...(publication.doi ? { url: publication.doi } : {}),
      },
    })),
  };
}

/** Next inlines this verbatim, so the value has to be a plain JSON string. */
export function jsonLdProps(schema: unknown) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
  } as const;
}
