/**
 * Most skill logos are flat marks, and the colourised variant under
 * `/skills/color/` gives them their brand colour while the original supplies
 * the glyph on top. That trick only works on artwork with a silhouette worth
 * filling. These entries are photographs of instruments and aircraft, where
 * the colouriser flattens the whole subject into one blob and the equipment
 * disappears — a green lozenge where the PhenoCam should be. They render from
 * the original frame instead.
 */
const PHOTOGRAPHIC_LOGOS = new Set([
  "agridrone",
  "digitallevel",
  "dji",
  "emlid",
  "ideaforge",
  "phenocam",
  "sokkia",
  "spectroradiometer",
  "theodolite",
  "tls",
  "trimble",
  "trinity",
  "ts",
]);

function skillLogoName(logo: string) {
  if (!logo.startsWith("/skills/")) return null;
  const filename = logo.split("/").pop();
  if (!filename) return null;
  return filename.replace(/\.[^.]+$/, "");
}

export function isPhotographicSkillLogo(logo: string) {
  const name = skillLogoName(logo);
  return name !== null && PHOTOGRAPHIC_LOGOS.has(name);
}

export function getColorSkillLogo(logo: string) {
  const name = skillLogoName(logo);
  if (name === null) return logo;
  if (PHOTOGRAPHIC_LOGOS.has(name)) return `/skills/${name}.webp`;
  return `/skills/color/${name}.webp`;
}

export function getOriginalSkillLogo(logo: string) {
  const name = skillLogoName(logo);
  if (name === null) return logo;
  return `/skills/${name}.webp`;
}
