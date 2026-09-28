"use client";

import { ChatProvider } from "@/contexts/ChatContext";
import { MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { ThemeProvider, useTheme } from "next-themes";
import React, { useEffect } from "react";
import { Toaster } from "sonner";

const Chat = dynamic(() => import("./Chat"), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      enableSystem
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
    >
      {/* Swipes, springs and fades step aside for prefers-reduced-motion. */}
      <MotionConfig reducedMotion="user">
        <ThemeColorUpdater />
        <ChatProvider>
          {children}
          <Chat />
        </ChatProvider>
        <ToastProvider />
      </MotionConfig>
    </ThemeProvider>
  );
}

function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      className="mt-12"
      position="top-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}

/**
 * The layout declares a theme colour per OS scheme; the site's own toggle can
 * differ from the OS, so once it resolves, both tags follow the page.
 */
function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const timerId = setTimeout(() => {
      const color = window.getComputedStyle(document.body).backgroundColor;
      document
        .querySelectorAll<HTMLMetaElement>("meta[name='theme-color']")
        .forEach((meta) => (meta.content = color));
    }, 0);
    return () => clearTimeout(timerId);
  }, [resolvedTheme]);

  return null;
}
