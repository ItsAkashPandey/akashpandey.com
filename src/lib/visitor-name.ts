const NOT_A_NAME = new Set(
  (
    "a an the not just here there interested looking from good fine ok okay great " +
    "student researcher professor curious trying working new back sorry glad happy " +
    "asking wondering going done sure also very so really bored hungry tired " +
    "confused lost busy free available ready able in on at with into about your " +
    "his her akash kasi bot human robot ai python drone phenocam gis looking " +
    "hiring recruiter checking writing from visiting"
  ).split(" "),
);

/**
 * A name only from an explicit introduction that is the whole message:
 * "I'm Rahul", "my name is Priya Sharma". The old rule treated any short
 * message as a name, so "python" became a visitor called Python.
 */
export function inferVisitorName(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length > 60) return null;
  const match = trimmed.match(
    /^(?:(?:hi|hello|hey|namaste)[,!.\s]+)?(?:my name is|my name's|call me|i am|i'm|this is)\s+([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*){0,2})\s*[.!]?$/iu,
  );
  if (!match) return null;
  const parts = match[1].split(/\s+/);
  if (parts.some((part) => NOT_A_NAME.has(part.toLowerCase()))) return null;
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
