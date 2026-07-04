import { cn } from "@/lib/utils";

type KasiMarkProps = {
  active?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-8 rounded-[11px]",
  md: "size-10 rounded-[14px]",
  lg: "size-11 rounded-[15px]",
};

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
        "relative isolate grid shrink-0 place-items-center overflow-hidden border transition-all duration-300",
        sizeClasses[size],
        active
          ? "border-sky-950/12 bg-[linear-gradient(145deg,#0b1220_0%,#173b6d_56%,#176b70_125%)] text-white shadow-[0_11px_30px_rgba(24,72,125,.24)] dark:border-white/15 dark:shadow-[0_12px_34px_rgba(0,0,0,.38)]"
          : "border-border/75 bg-background text-muted-foreground shadow-[inset_0_0_0_1px_hsl(var(--border)/.32)]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          active
            ? "bg-[radial-gradient(circle_at_72%_16%,rgba(255,255,255,.28),transparent_28%),radial-gradient(circle_at_20%_85%,rgba(45,212,191,.19),transparent_36%)] opacity-100"
            : "opacity-0",
        )}
      />
      <svg viewBox="0 0 40 40" fill="none" className="relative z-10 size-[72%]">
        <ellipse
          cx="20"
          cy="20"
          rx="13.8"
          ry="7.5"
          transform="rotate(-28 20 20)"
          stroke="currentColor"
          strokeWidth="1.45"
          opacity={active ? 0.58 : 0.4}
        />
        <ellipse
          cx="20"
          cy="20"
          rx="13.8"
          ry="7.5"
          transform="rotate(32 20 20)"
          stroke="currentColor"
          strokeWidth="1.15"
          opacity={active ? 0.35 : 0.25}
        />
        <path
          d="M20 9.5c1.2 5.7 4.8 9.3 10.5 10.5-5.7 1.2-9.3 4.8-10.5 10.5-1.2-5.7-4.8-9.3-10.5-10.5C15.2 18.8 18.8 15.2 20 9.5Z"
          fill="currentColor"
        />
        <circle cx="31.2" cy="15.2" r="2" fill="currentColor" />
        <circle cx="9.4" cy="25.6" r="1.55" fill="currentColor" opacity=".72" />
      </svg>
      <span
        className={cn(
          "absolute right-1.5 bottom-1.5 z-20 size-1.5 rounded-full ring-2 transition-colors",
          active
            ? "bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,.1)] ring-emerald-300/15"
            : "bg-zinc-400 ring-zinc-400/10",
        )}
      />
    </span>
  );
}
