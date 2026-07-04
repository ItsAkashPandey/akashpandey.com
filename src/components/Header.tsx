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
    <header className="border-border/10 bg-background/75 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-5 py-3.5 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          {/* Desktop Navigation */}
          <ul className="hidden gap-8 md:flex">
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent/50 transition-all active:scale-95"
                >
                  <Menu className="text-foreground/80 size-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 flex h-screen flex-col border-none pt-20 shadow-2xl backdrop-blur-xl sm:max-w-xs">
                <DialogHeader className="hidden">
                  <DialogTitle>Navigation</DialogTitle>
                </DialogHeader>
                <nav className="flex flex-col gap-6 px-4">
                  {navLinks.map((nav, id) => (
                    <Link
                      key={id}
                      href={nav.href}
                      onClick={() => setOpen(false)}
                      className="text-foreground/90 hover:text-primary font-serif text-3xl tracking-tight transition-all hover:translate-x-2"
                    >
                      {nav.name}.
                    </Link>
                  ))}
                </nav>
                <div className="border-border/10 mt-auto flex items-center justify-between border-t px-4 pt-8 pb-12">
                  <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                    Connect
                  </p>
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
