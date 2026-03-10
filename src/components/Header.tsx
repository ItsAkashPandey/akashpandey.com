"use client";

import Link from "next/link";
import ChatToggle from "./ChatToggle";
import ThemeToggle from "./ThemeToggle";
import { Menu, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
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

  return (
    <header className="sticky top-0 z-50 bg-background/75 backdrop-blur-md border-b border-border/10">
      <div className="mx-auto max-w-4xl px-6 sm:px-8 py-4">
        <nav className="flex items-center justify-between">
          {/* Desktop Navigation */}
          <ul className="hidden md:flex gap-8">
            {navLinks.map((nav, id) => (
              <li key={id} className="link font-medium">
                <Link href={nav.href} title={nav.title}>
                  {nav.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-all active:scale-95">
                  <Menu className="size-6 text-foreground/80" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs border-none bg-background/95 backdrop-blur-xl h-screen flex flex-col pt-20 shadow-2xl">
                <DialogHeader className="hidden">
                  <DialogTitle>Navigation</DialogTitle>
                </DialogHeader>
                <nav className="flex flex-col gap-6 px-4">
                  {navLinks.map((nav, id) => (
                    <Link
                      key={id}
                      href={nav.href}
                      onClick={() => setOpen(false)}
                      className="text-3xl font-serif tracking-tight text-foreground/90 hover:text-primary transition-all hover:translate-x-2"
                    >
                      {nav.name}.
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto pb-12 px-4 border-t border-border/10 pt-8 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Connect</p>
                  <div className="flex gap-4">
                    {/* Standard toggles inside mobile menu for convenience */}
                  </div>
                </div>
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
