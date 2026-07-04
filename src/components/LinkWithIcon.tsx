import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type LinkWithIconProps = {
  href: string;
  icon?: React.ReactNode;
  position: "left" | "right";
  text?: string;
  className?: string;
};

export default function LinkWithIcon({
  href,
  icon,
  position,
  text,
  className,
}: LinkWithIconProps) {
  return (
    <Link
      href={href}
      className={cn(
        "border-border/60 bg-background/72 text-foreground hover:border-foreground/20 hover:bg-background group inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      {position === "left" && icon}
      <span>{text}</span>
      {position === "right" && (
        <span className="transition-transform group-hover:translate-x-0.5">
          {icon}
        </span>
      )}
    </Link>
  );
}
