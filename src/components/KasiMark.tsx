import { cn } from "@/lib/utils";
import { useId } from "react";

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

export default function KasiMark({
  active = true,
  className,
  size = "md",
}: KasiMarkProps) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <span
      aria-hidden
      data-active={active ? "true" : "false"}
      className={cn(
        "relative grid shrink-0 place-items-center transition-transform duration-300",
        sizeClasses[size],
        active && "drop-shadow-[0_8px_12px_rgba(30,64,175,.22)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="size-[94%] overflow-visible"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="9"
            y1="7"
            x2="39"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1E3A8A" />
            <stop offset=".53" stopColor="#2563EB" />
            <stop offset="1" stopColor="#0F766E" />
          </linearGradient>
        </defs>

        <path
          d="M12.4 6.5h23.2c4.3 0 7.9 3.6 7.9 7.9v15.2c0 4.3-3.6 7.9-7.9 7.9H24.1l-8.8 5.1c-1.5.9-3.4-.2-3.3-2l.2-3.4a8 8 0 0 1-7.7-7.9V14.4c0-4.3 3.6-7.9 7.9-7.9Z"
          fill={active ? `url(#${gradientId})` : undefined}
          className={cn(
            "transition-colors duration-300",
            !active &&
              "fill-slate-100 stroke-slate-400 dark:fill-zinc-800 dark:stroke-zinc-500",
          )}
          strokeWidth={active ? 0 : 1.25}
        />

        <g
          stroke={active ? "rgba(255,255,255,.88)" : "currentColor"}
          className={cn(
            "transition-colors duration-300",
            active ? "text-white" : "text-slate-600 dark:text-zinc-300",
          )}
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 27.2c2.1 0 2.7-2.2 4.7-2.2s2.5 2.2 4.7 2.2c2.1 0 2.7-2.2 4.7-2.2" />
          <path d="M17.2 18.7h8.4" opacity=".72" />
          <circle
            cx="14.7"
            cy="18.7"
            r="1.55"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="31.4"
            cy="25"
            r="1.55"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="22.1"
            cy="27.2"
            r="1.55"
            fill="currentColor"
            stroke="none"
          />
        </g>

        <path
          d="M34.3 12.1c.45 2.2 1.8 3.55 4 4-2.2.45-3.55 1.8-4 4-.45-2.2-1.8-3.55-4-4 2.2-.45 3.55-1.8 4-4Z"
          fill={active ? "#BAE6FD" : "currentColor"}
          className={!active ? "text-slate-500 dark:text-zinc-400" : undefined}
        />
      </svg>
    </span>
  );
}
