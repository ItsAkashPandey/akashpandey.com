import type { SVGProps } from "react";

/**
 * Drawn rather than picked off a shelf.
 *
 * A general-purpose icon library gives every site the same graduation cap,
 * briefcase and rocket, and that sameness is most of what reads as generic.
 * These are thin engraved marks on a 24 grid in the vocabulary the rest of the
 * site already speaks — field notebooks, plate figures, survey sheets — so a
 * category is legible without borrowing anyone else's handwriting.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Field({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** An open book, drawn as two leaves off a spine. */
export function OpenLeavesIcon(props: IconProps) {
  return (
    <Field {...props}>
      <path d="M12 6.6v12" />
      <path d="M12 6.6C10.2 5.3 7.9 4.8 5 5.1v11.7c2.9-.3 5.2.2 7 1.5" />
      <path d="M12 6.6c1.8-1.3 4.1-1.8 7-1.5v11.7c-2.9-.3-5.2.2-7 1.5" />
      <path d="M7.4 8.6h2.2M14.4 8.6h2.2" opacity=".55" />
    </Field>
  );
}

/** A field case: the box the instruments travel in. */
export function FieldCaseIcon(props: IconProps) {
  return (
    <Field {...props}>
      <rect x="3.2" y="8" width="17.6" height="11" rx="1.6" />
      <path d="M9 8V6.4c0-.8.6-1.4 1.4-1.4h3.2c.8 0 1.4.6 1.4 1.4V8" />
      <path d="M3.2 12.6h17.6" opacity=".55" />
      <path d="M10.6 12.6h2.8" />
    </Field>
  );
}

/** A map legend: three keyed rules of differing length. */
export function LegendIcon(props: IconProps) {
  return (
    <Field {...props}>
      <path d="M4.6 7.4h14.8" />
      <path d="M4.6 12h10.2" />
      <path d="M4.6 16.6h6.4" />
      <circle cx="20.2" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="16.4" cy="16.6" r="1.05" fill="currentColor" stroke="none" />
    </Field>
  );
}

/** A plate: a figure page with its caption rules. */
export function PlateIcon(props: IconProps) {
  return (
    <Field {...props}>
      <path d="M5.4 3.8h8.4l4.8 4.8v11.6H5.4z" />
      <path d="M13.8 3.8v4.8h4.8" />
      <path d="M8.2 12.6h7.6M8.2 15.8h5" opacity=".6" />
    </Field>
  );
}

/** A shoot breaking ground — what the startup work is actually about. */
export function ShootIcon(props: IconProps) {
  return (
    <Field {...props}>
      <path d="M12 19.4v-7.6" />
      <path d="M12 12.4c-.4-2.6-2.2-4.1-4.8-4.4-.2 2.7 1.4 4.6 4.8 4.4Z" />
      <path d="M12 11.2c.4-2.9 2.3-4.6 5.3-4.9.2 3-1.6 5.1-5.3 4.9Z" />
      <path d="M6.6 19.4h10.8" opacity=".6" />
    </Field>
  );
}

/** A journal article: a page carrying a plotted series. */
export function SeriesPageIcon(props: IconProps) {
  return (
    <Field {...props}>
      <rect x="4.4" y="3.8" width="15.2" height="16.4" rx="1.5" />
      <path d="M7.4 15.6c1.6 0 2.1-4.4 3.6-4.4s2 3.1 3.5 3.1 1.7-2.6 2.6-2.6" />
      <path d="M7.4 7.6h6" opacity=".6" />
    </Field>
  );
}

/** A conference: a projected plate and the floor it stands on. */
export function PodiumIcon(props: IconProps) {
  return (
    <Field {...props}>
      <rect x="3.6" y="4.4" width="16.8" height="10.4" rx="1.4" />
      <path d="M12 14.8v4.6" />
      <path d="M8.4 19.4h7.2" />
      <path d="M7.4 11.2c1.4 0 1.9-3.2 3.2-3.2s1.8 2.2 3.1 2.2 1.5-1.8 2.4-1.8" opacity=".7" />
    </Field>
  );
}

/** A bound volume, seen on its edge. */
export function VolumeIcon(props: IconProps) {
  return (
    <Field {...props}>
      <path d="M6 4.2h11.4c.9 0 1.6.7 1.6 1.6v12.4c0 .9-.7 1.6-1.6 1.6H6" />
      <path d="M6 4.2A1.8 1.8 0 0 0 4.2 6v12a1.8 1.8 0 0 0 1.8 1.8" />
      <path d="M7.6 4.2v15.6" opacity=".55" />
    </Field>
  );
}

/** A volume with the chapter marked. */
export function ChapterIcon(props: IconProps) {
  return (
    <Field {...props}>
      <path d="M6 4.2h11.4c.9 0 1.6.7 1.6 1.6v12.4c0 .9-.7 1.6-1.6 1.6H6" />
      <path d="M6 4.2A1.8 1.8 0 0 0 4.2 6v12a1.8 1.8 0 0 0 1.8 1.8" />
      <path d="M11.6 4.2v7.2l2.4-1.7 2.4 1.7V4.2" />
    </Field>
  );
}

/** A draft: a sheet still carrying its correction marks. */
export function DraftIcon(props: IconProps) {
  return (
    <Field {...props}>
      <path d="M5.6 3.8h7.8l4.4 4.4v7.2" />
      <path d="M13.4 3.8v4.4h4.4" />
      <path d="M5.6 3.8v16.4h6.2" />
      <path d="M8.6 12.4h4.2" opacity=".6" />
      <path d="M14.6 19.6l4.6-4.6 1.4 1.4-4.6 4.6-1.9.5z" />
    </Field>
  );
}
