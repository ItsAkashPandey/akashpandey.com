"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";

const ORDER = ["light", "dark", "system"] as const;
type Choice = (typeof ORDER)[number];

const LABELS: Record<Choice, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "Match your device",
};

/**
 * Cycles light → dark → system. next-themes owns the class on <html> and the
 * stored choice; this only asks it to change.
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current: Choice = mounted && ORDER.includes(theme as Choice)
    ? (theme as Choice)
    : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <Button
      size="icon"
      variant="ghost"
      className="header-icon-button"
      onClick={() => setTheme(next)}
      title={`${LABELS[current]}. Switch to: ${LABELS[next].toLowerCase()}`}
    >
      <Icon
        className={
          current === "light"
            ? "text-tone-amber size-4"
            : current === "dark"
              ? "text-tone-sky size-4"
              : "text-muted-foreground size-4"
        }
      />
      <span className="sr-only">
        {LABELS[current]}. Switch to {LABELS[next].toLowerCase()}
      </span>
    </Button>
  );
}
