"use client";

import { useChatbot } from "@/contexts/ChatContext";
import KasiMark from "./KasiMark";
import { Button } from "./ui/Button";

export default function ChatToggle() {
  const { isOpen, toggleChat } = useChatbot();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleChat}
      className="border-border/55 bg-background/60 relative size-10 rounded-xl border shadow-sm"
      title={isOpen ? "Close Kasi" : "Open Kasi"}
    >
      <KasiMark active={isOpen} size="sm" />
      <span className="sr-only">{isOpen ? "Close Kasi" : "Open Kasi"}</span>
    </Button>
  );
}
