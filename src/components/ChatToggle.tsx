"use client";

import { useChatbot } from "@/contexts/ChatContext";
import KasiMark from "./KasiMark";
import { Button } from "./ui/Button";

export default function ChatToggle() {
  const { isVisible, toggleChatbot } = useChatbot();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleChatbot}
      className="border-border/55 bg-background/60 relative size-10 rounded-xl border shadow-sm"
      title={isVisible ? "Hide Kasi" : "Show Kasi"}
    >
      <KasiMark active={isVisible} size="sm" />
      <span className="sr-only">{isVisible ? "Hide Kasi" : "Show Kasi"}</span>
    </Button>
  );
}
