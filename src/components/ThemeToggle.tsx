"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, [resolvedTheme]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme = root.classList.contains("dark") ? "light" : "dark";
    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
    root.style.colorScheme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
    setIsDark(nextTheme === "dark");
    setTheme(nextTheme);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="header-icon-button"
      onClick={toggleTheme}
      title={isDark ? "Use light theme" : "Use dark theme"}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-300" />
      ) : (
        <Moon className="size-4 text-sky-700" />
      )}
      <span className="sr-only">Theme Toggle</span>
    </Button>
  );
}
