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
          ? "border-zinc-950/10 bg-zinc-950 text-white shadow-[0_8px_24px_rgba(15,23,42,0.22)] dark:border-white/20 dark:bg-white dark:text-zinc-950 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
          : "border-border bg-muted text-muted-foreground shadow-inner",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          active &&
            "bg-[radial-gradient(circle_at_75%_18%,rgba(52,211,153,0.34),transparent_34%),radial-gradient(circle_at_10%_100%,rgba(56,189,248,0.25),transparent_45%)] opacity-100 dark:bg-[radial-gradient(circle_at_75%_18%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_10%_100%,rgba(14,165,233,0.14),transparent_45%)]",
        )}
      />
      <svg viewBox="0 0 40 40" fill="none" className="relative z-10 size-[62%]">
        <path
          d="M11.5 9.5v21M27.8 9.8 15 20l13.4 10.2"
          stroke="currentColor"
          strokeWidth="3.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29.8 6.8c2.4 1.8 3.8 4 4.5 6.7M7 30.5c-1.2-2-1.8-4.3-1.7-6.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity={active ? 0.62 : 0.3}
        />
        <circle cx="31.8" cy="8.2" r="2" fill="currentColor" />
        <circle cx="7.2" cy="31.5" r="1.55" fill="currentColor" />
      </svg>
      <span
        className={cn(
          "absolute right-1.5 bottom-1.5 z-20 size-1.5 rounded-full ring-2 ring-current/15 transition-colors",
          active ? "bg-emerald-400" : "bg-zinc-400",
        )}
      />
    </span>
  );
}
