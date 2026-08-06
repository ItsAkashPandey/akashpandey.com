import { cn } from "@/lib/utils";

type KasiMarkProps = {
  active?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-8",
  md: "size-10",
  lg: "size-11",
};

/**
 * A PhenoCam framing a shoot: camera registration corners closing on a leaf.
 *
 * Two marks came before this. A blue gradient speech bubble with an AI sparkle
 * on it — the stock chatbot badge, in a blue the site uses nowhere else — and
 * then a pair of contour rings, which was on-theme but read as abstract
 * decoration rather than as a thing. This one is literally the work: a camera
 * pointed at a growing plant, which is what the whole site is about, and it is
 * legible at 20px.
 */
export default function KasiMark({
  active = true,
  className,
  size = "md",
}: KasiMarkProps) {
  return (
    <span
      aria-hidden
      data-active={active ? "true" : "false"}
      className={cn(
        "relative grid shrink-0 place-items-center transition-colors duration-300",
        sizeClasses[size],
        active
          ? "text-[hsl(var(--accent-ink))]"
          : "text-muted-foreground opacity-70",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-full"
      >
        {/* Registration corners — the frame the camera holds on the canopy. */}
        <path d="M4 10.6V6.4A2.4 2.4 0 0 1 6.4 4h4.2" />
        <path d="M21.4 4h4.2A2.4 2.4 0 0 1 28 6.4v4.2" />
        <path d="M28 21.4v4.2a2.4 2.4 0 0 1-2.4 2.4h-4.2" />
        <path d="M10.6 28H6.4A2.4 2.4 0 0 1 4 25.6v-4.2" />

        {/* The shoot it is watching. */}
        <path d="M16 23.4v-8" />
        <path
          d="M16 16.2c-.5-2.9-2.4-4.5-5.3-4.8-.2 3 1.6 5.1 5.3 4.8Z"
          fill="currentColor"
          fillOpacity=".14"
        />
        <path
          d="M16 14.6c.5-3.2 2.6-5 5.9-5.4.2 3.3-1.8 5.7-5.9 5.4Z"
          fill="currentColor"
          fillOpacity=".14"
        />
      </svg>
    </span>
  );
}
