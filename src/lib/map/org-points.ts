import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import educationLocations from "@/data/education-locations.json";
import experienceLocations from "@/data/experience-locations.json";
import { careerSchema, educationSchema } from "@/lib/schemas";

export type OrgPoint = {
  coordinates: [number, number];
  label: string;
  href: string;
  positions: { title: string; start: string; end?: string }[];
};

type LocationMap = Record<string, [number, number]>;

/** Unlike activities (one geocoded point per free-text location string),
 * career.json and education.json already group by organisation — one row
 * per employer or school, each with its own positions — so this only needs
 * a name-to-coordinates lookup, no grouping. An org with no entry here
 * (unknown site, e.g. DK Architects) is silently skipped rather than
 * guessed at.
 *
 * Education and experience each get their own lookup file. For IIT Roorkee
 * both resolve to the same real campus centroid — there's no separately
 * published coordinate for "the PhD office" vs "the JRF desk" — so each
 * file nudges that shared point ~50m apart (and education's MANIT Bhopal
 * point nudges away from the activity pin for the same campus). That's a
 * display fix, not a location claim: it keeps pins from stacking exactly on
 * top of each other, which would make the lower one unclickable, while
 * staying well inside the same building/campus. */
function toPoints(
  orgs: {
    name: string;
    href: string;
    positions: { title: string; start: string; end?: string }[];
  }[],
  locations: LocationMap,
): OrgPoint[] {
  return orgs.flatMap((org) => {
    const coordinates = locations[org.name];
    if (!coordinates) return [];
    return [
      { coordinates, label: org.name, href: org.href, positions: org.positions },
    ];
  });
}

export function buildEducationPoints(): OrgPoint[] {
  return toPoints(
    educationSchema.parse(educationData).education,
    educationLocations as unknown as LocationMap,
  );
}

export function buildExperiencePoints(): OrgPoint[] {
  return toPoints(
    careerSchema.parse(careerData).career,
    experienceLocations as unknown as LocationMap,
  );
}
