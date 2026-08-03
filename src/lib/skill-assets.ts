/**
 * `/skills/color/` holds a brand-coloured duotone of each mark, built by
 * scripts/colorize-skill-icons.mjs. It keeps the original artwork's luminance,
 * so a photographed instrument still reads as that instrument — which is why
 * nothing needs a second detail layer painted over it any more.
 */
export function getColorSkillLogo(logo: string) {
  if (!logo.startsWith("/skills/")) return logo;
  const filename = logo.split("/").pop();
  if (!filename) return logo;
  return `/skills/color/${filename.replace(/\.[^.]+$/, ".webp")}`;
}

export function getOriginalSkillLogo(logo: string) {
  if (!logo.startsWith("/skills/")) return logo;
  const filename = logo.split("/").pop();
  if (!filename) return logo;
  return `/skills/${filename.replace(/\.[^.]+$/, ".webp")}`;
}
