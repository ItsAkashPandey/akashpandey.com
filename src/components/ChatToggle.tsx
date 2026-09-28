"use client";

import { useChatbot } from "@/contexts/ChatContext";
import KasiMark from "./KasiMark";
import { Button } from "./ui/Button";

export default function ChatToggle() {
  const { isOpen, toggleChat } = useChatbot();
  const label = isOpen ? "Close Kasi" : "Ask Kasi";

  return (
    <Button
      variant="ghost"
      data-kasi-toggle
      onClick={toggleChat}
      aria-expanded={isOpen}
      className="header-icon-button relative w-auto gap-1.5 px-2 md:pr-3"
      title={label}
    >
      <KasiMark active={isOpen} size="sm" />
      <span className="sr-only md:not-sr-only md:text-sm md:font-semibold">
        {label}
      </span>
    </Button>
  );
}
