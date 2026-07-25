"use client";

import Link from "next/link";
import ChatToggle from "./ChatToggle";
import ThemeToggle from "./ThemeToggle";
import { Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState } from "react";

import routesData from "@/data/routes.json";

const navLinks = routesData.routes
  .filter((route) => route.showInNav)
  .map((route) => ({
    name: route.name,
    href: route.path,
    title: route.description,
  }));

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-border/70 bg-background/94 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="site-shell py-3.5">
        <nav className="flex items-center justify-between">
          <ul className="hidden gap-8 md:flex">
            {navLinks.map((nav, id) => (
              <li key={id}>
                <Link
                  href={nav.href}
                  title={nav.title}
                  aria-current={pathname === nav.href ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:text-foreground relative block py-1 text-sm font-medium transition-colors",
                    pathname === nav.href &&
                      "text-foreground after:absolute after:right-0 after:-bottom-1 after:left-0 after:h-px after:bg-[hsl(var(--map-accent))]",
                  )}
                >
                  {nav.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="md:hidden">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  title="Open navigation menu"
                  className="header-icon-button active:scale-[0.98]"
                >
                  <Menu className="text-foreground/80 size-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 flex h-screen flex-col border-none pt-20 shadow-2xl backdrop-blur-xl sm:max-w-xs">
                <DialogHeader className="hidden">
                  <DialogTitle>Navigation</DialogTitle>
                  <DialogDescription>
                    Choose a page on Akash&apos;s portfolio.
                  </DialogDescription>
                </DialogHeader>
                <nav className="flex flex-col gap-6 px-4">
                  {navLinks.map((nav, id) => (
                    <Link
                      key={id}
                      href={nav.href}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === nav.href ? "page" : undefined}
                      className="text-foreground/90 hover:text-primary font-serif text-3xl tracking-normal transition-transform hover:translate-x-1"
                    >
                      {nav.name}.
                    </Link>
                  ))}
                </nav>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ChatToggle />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
