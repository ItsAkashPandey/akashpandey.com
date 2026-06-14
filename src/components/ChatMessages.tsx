import type { ChatMessageShape } from "@/lib/chat-types";
import { Loader2, MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatPrompts from "./ChatPrompts";

interface ChatMessagesProps {
  messages: ChatMessageShape[];
  error: Error | undefined;
  isLoading: boolean;
  onPromptClick?: (prompt: string) => void;
}

export default function ChatMessages({
  messages,
  error,
  isLoading,
  onPromptClick,
}: ChatMessagesProps) {
  const isLastMessageUser = messages[messages.length - 1]?.role === "user";

  // Scroll to new messages automatically with smooth behavior
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      const scrollOptions: ScrollToOptions = {
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      };
      scrollRef.current.scrollTo(scrollOptions);
    }
  }, [messages]);

  return (
    <div
      className="h-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain scroll-smooth p-3 sm:p-4"
      ref={scrollRef}
    >
      <ul className="space-y-3">
        {messages.map((msg) => (
          <li key={msg.id}>
            <ChatMessage message={msg} onPromptClick={onPromptClick} />
          </li>
        ))}
      </ul>

      {/* empty */}
      {!error && messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 sm:gap-3 sm:p-4">
          <MessageCircle className="size-6 sm:size-8" />
          <p className="text-sm font-medium">
            Send a message to start the chat!
          </p>
          <p className="text-muted-foreground max-w-[200px] text-center text-xs sm:max-w-[250px]">
            You can ask the bot anything about me and it will help to find the
            relevant information!
          </p>
          {onPromptClick && <ChatPrompts onPromptClick={onPromptClick} />}
        </div>
      )}

      {/* loading */}
      {isLoading && isLastMessageUser && (
        <div className="flex items-center justify-start pl-2">
          <div className="bg-background/70 flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm">
            <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
            <p className="text-muted-foreground text-xs">Thinking</p>
          </div>
        </div>
      )}

      {/* error */}
      {error && (
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="max-w-[280px] rounded-xl border border-rose-200/30 bg-rose-500/10 px-4 py-3 text-center dark:border-rose-500/10 dark:bg-rose-500/5">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error.message ||
                "Oops, something went sideways 🙃 — please try again!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
