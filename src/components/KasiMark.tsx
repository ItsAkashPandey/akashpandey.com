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
 * A survey station drawn the way a topographic sheet draws one: two contour
 * rings closing on a levelled point, with the tick marks that fix it.
 *
 * The mark this replaces was a blue gradient speech bubble with an AI sparkle
 * on it — the stock chatbot badge, in a blue the rest of the site does not
 * use. This says the same thing the page says: someone who maps ground.
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
        viewBox="0 0 48 48"
        fill="none"
        className="size-full"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer contour — deliberately not a circle, the way a real one is
            never a circle. */}
        <path
          d="M24 5.4c7.1-.4 13.6 4.3 16.2 10.6 2.6 6.4 1.2 14.2-4 18.9-5.2 4.7-13.6 5.9-19.9 3.1C10 35.2 5.6 28.4 6.1 21.5 6.6 14.2 13 6.9 19.8 5.8c1.4-.25 2.8-.34 4.2-.4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.55"
        />
        {/* Inner contour */}
        <path
          d="M24 13.2c4.2-.3 8.1 2.4 9.6 6.1 1.5 3.8.5 8.5-2.6 11.1-3.1 2.6-8.1 3.2-11.7 1.4-3.6-1.8-6-5.8-5.6-9.7.4-4 4-8.3 8-8.8.8-.1 1.5-.1 2.3-.1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.85"
        />
        {/* The levelled point, and the ticks that fix it. */}
        <circle cx="24" cy="23" r="2.6" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.5" opacity="0.9">
          <path d="M24 2.8v4.2" />
          <path d="M24 39v4.2" />
          <path d="M2.6 23h4.2" />
          <path d="M41.2 23h4.2" />
        </g>
      </svg>
    </span>
  );
}
