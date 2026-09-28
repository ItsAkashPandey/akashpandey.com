"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

// The palette (and cmdk) only load once someone actually opens it.
const loadPalette = () => import("./SearchPalette");
const SearchPalette = dynamic(loadPalette, { ssr: false });

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");

  useEffect(() => {
    // After mount, so the server-rendered label always matches.
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
      setShortcut("⌘K");
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setUsed(true);
        setOpen((current) => !current);
      } else if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        setUsed(true);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          setUsed(true);
          setOpen(true);
        }}
        // Start fetching the code as soon as a click looks likely.
        onPointerEnter={() => void loadPalette()}
        onFocus={() => void loadPalette()}
        aria-label="Search the site"
        aria-keyshortcuts="Control+K Meta+K /"
        title="Search the site"
        className="header-icon-button relative w-auto gap-2 px-2 md:pr-2.5"
      >
        <Search className="text-foreground/80 size-4" aria-hidden />
        <span className="hidden text-sm font-semibold md:inline">Search</span>
        <kbd className="text-muted-foreground border-border hidden rounded border px-1.5 py-px font-sans text-[10px] font-medium lg:inline">
          {shortcut}
        </kbd>
      </Button>
      {used && (
        <SearchPalette open={open} onOpenChange={setOpen} shortcut={shortcut} />
      )}
    </>
  );
}
