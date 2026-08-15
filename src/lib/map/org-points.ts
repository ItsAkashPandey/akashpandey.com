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
 * guessed at. Education and experience each get their own lookup, even
 * though IIT Roorkee appears in both, so the PhD pin and the job pin land
 * a short distance apart on campus instead of stacking exactly on top of
 * each other. */
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
