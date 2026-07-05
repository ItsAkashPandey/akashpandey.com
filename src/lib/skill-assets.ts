export function getColorSkillLogo(logo: string) {
  if (!logo.startsWith("/skills/")) return logo;
  const filename = logo.split("/").pop();
  if (!filename) return logo;
  return `/skills/color/${filename.replace(/\.[^.]+$/, ".webp")}`;
}
