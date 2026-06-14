"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { MessageCircle, MessageCircleOff, Sparkles } from "lucide-react";
import { Button } from "./ui/Button";

export default function ChatToggle() {
  const { isVisible, toggleChatbot } = useChatbot();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleChatbot}
      className="relative rounded-xl"
      title={isVisible ? "Hide chat" : "Show chat"}
    >
      {isVisible ? (
        <>
          <MessageCircle className="size-5" />
          <Sparkles className="text-primary absolute top-1.5 right-1.5 size-2.5" />
        </>
      ) : (
        <MessageCircleOff className="size-5" />
      )}
      <span className="sr-only">Chat Toggle</span>
    </Button>
  );
}
