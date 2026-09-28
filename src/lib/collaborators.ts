/**
 * Parses the "With: ..." line at the end of an activity description into
 * people and groups, and resolves the people to LinkedIn profiles.
 */

const GEOSPATIAL_GROUP =
  "https://www.linkedin.com/company/geospatial-engineering-group-indian-institute-of-technology-roorkee/posts/?feedView=all";

/** Keys are lowercase names with honorifics removed. */
const LINKEDIN_PROFILES: Record<string, string> = {
  "idhayachandhiran ilampooranan": "https://www.linkedin.com/in/idhaya/",
  "mukund narayanan": "https://www.linkedin.com/in/mukund-narayanan-0b63a310b/",
  "siddhartha khare": "https://www.linkedin.com/in/siddhartha-khare-503a4429/",
  "saurabh vijay": "https://www.linkedin.com/in/saurabh-vijay-phd-b93a1429/",
  "tushar bharadwaj": "https://www.linkedin.com/in/tusharbharadwaj/",
  "shreyas goswami": "https://www.linkedin.com/in/goswami-shreyas/",
  "apurwa chaurasia": "https://www.linkedin.com/in/apurwa-chaurasia-6a9969b1/",
  "peeyush jasaiwal": "https://www.linkedin.com/in/peeyush-jasaiwal/",
  peeyush: "https://www.linkedin.com/in/peeyush-jasaiwal/",
  "amarjeet kumar mahato":
    "https://www.linkedin.com/in/amarjeet-kumar-mahato-630619160/",
  "gaurav singh bareth": "https://www.linkedin.com/in/g2306/",
  "ishfaqul haque": "https://www.linkedin.com/in/ishfaqul-haque-a24a61251/",
  "isfaqul haque": "https://www.linkedin.com/in/ishfaqul-haque-a24a61251/",
  "nitin lodhi": "https://www.linkedin.com/in/nitin-lodhi-215b72260/",
  "prashant singh": "https://www.linkedin.com/in/prashant-singh-356409b1/",
  "sahil kundal": "https://www.linkedin.com/in/skundal1/",
  "sushmit srivastava":
    "https://www.linkedin.com/in/sushmit-srivastava-598403206/",
  "akash a": "https://www.linkedin.com/in/akash-anilraj/",
  "suyash khare": "https://www.linkedin.com/in/suyash-khare-6450341b6/",
  "geospatial engineering group, iitr": GEOSPATIAL_GROUP,
  "geospatial engineering group": GEOSPATIAL_GROUP,
  "vivek malik": "https://www.linkedin.com/in/vivek-malik-57839415/",
  "vivek kumar malik": "https://www.linkedin.com/in/vivek-malik-57839415/",
  "neeraj pant": "https://www.linkedin.com/in/neeraj-pant-2508322b4/",
  "sivani noolu": "https://www.linkedin.com/in/shivani-noolu-647a79214/",
  "shivani noolu": "https://www.linkedin.com/in/shivani-noolu-647a79214/",
  sivani: "https://www.linkedin.com/in/shivani-noolu-647a79214/",
  shivani: "https://www.linkedin.com/in/shivani-noolu-647a79214/",
  "madhulika singh": "https://www.linkedin.com/in/madhulika-singh-0721141aa/",
};

/** People who have no LinkedIn profile to link to. */
const WITHOUT_PROFILE = new Set(["geetu saini", "umesh saxena"]);

/** Descriptions of several people ("course participants") rather than one. */
const GROUP_PATTERN =
  /\b(organizers|organisers|participants|colleagues|volunteering tas|team|students|officers)\b/i;

const PREFIX_PATTERN = /^(my supervisor)\s*[-–—]\s*/i;
const HONORIFIC_PATTERN = /^(prof|dr|mr|mrs|ms|er)\.?\s+/i;

export type Collaborator =
  | { kind: "group"; label: string }
  | {
      kind: "person";
      label: string;
      /** e.g. "my supervisor" */
      role?: string;
      href?: string;
      /** True for a known profile, false for a LinkedIn people search. */
      verified: boolean;
    };

export function collaboratorKey(name: string) {
  return name
    .replace(/[.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(HONORIFIC_PATTERN, "")
    .toLowerCase();
}

/**
 * "A, B, and C" / "A & B" / "Group, IITR" -> ["A", "B", "C"] / ["A", "B"] /
 * ["Group, IITR"]. An all-caps word after a comma is an institute suffix of
 * the previous entry, not a person.
 */
export function splitCollaborators(text: string) {
  const parts = text
    .trim()
    .replace(/[.]+$/g, "")
    .split(/\s*,\s*(?:and\s+|&\s*)?|\s+and\s+|\s*&\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const part of parts) {
    if (/^[A-Z]{2,6}$/.test(part) && merged.length) {
      merged[merged.length - 1] += `, ${part}`;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

export function parseCollaborators(text: string): Collaborator[] {
  return splitCollaborators(text).map((part): Collaborator => {
    const roleMatch = part.match(PREFIX_PATTERN);
    const role = roleMatch?.[1]?.toLowerCase();
    const label = part.slice(roleMatch?.[0].length ?? 0).trim();
    const key = collaboratorKey(label);

    const profile = LINKEDIN_PROFILES[key];
    if (profile) return { kind: "person", label, role, href: profile, verified: true };
    if (GROUP_PATTERN.test(label)) return { kind: "group", label };
    if (WITHOUT_PROFILE.has(key)) return { kind: "person", label, role, verified: false };

    return {
      kind: "person",
      label,
      role,
      verified: false,
      href: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        label.replace(HONORIFIC_PATTERN, ""),
      )}`,
    };
  });
}

/** Splits a description into its body and the text after "With:". */
export function splitDescription(description: string) {
  const [body, collaborators] = description.split(/\n+\s*With:\s*/);
  return { body: body.trim(), collaborators: collaborators?.trim() || null };
}
