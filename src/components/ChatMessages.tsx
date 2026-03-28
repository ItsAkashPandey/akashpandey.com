type ChatMessageShape = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
import { Bot, Loader2 } from "lucide-react";
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
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth p-2 sm:p-3"
      ref={scrollRef}
    >
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            <ChatMessage message={msg} />
          </li>
        ))}
      </ul>

      {/* empty */}
      {!error && messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 sm:gap-3 sm:p-4">
          <Bot className="size-6 sm:size-8" />
          <p className="text-sm font-medium">
            Send a message to start the chat!
          </p>
          <p className="max-w-[200px] text-center text-xs text-muted-foreground sm:max-w-[250px]">
            You can ask the bot anything about me and it will help to find the
            relevant information!
          </p>
          {onPromptClick && <ChatPrompts onPromptClick={onPromptClick} />}
        </div>
      )}

      {/* loading */}
      {isLoading && isLastMessageUser && (
        <div className="flex items-center justify-center">
          <Loader2 className="mr-1.5 size-3 animate-spin text-muted-foreground" />
          <p className="text-center text-xs text-muted-foreground">
            Thinking...
          </p>
        </div>
      )}

      {/* error */}
      {error && (
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="rounded-xl bg-rose-500/10 dark:bg-rose-500/5 border border-rose-200/30 dark:border-rose-500/10 px-4 py-3 text-center max-w-[260px]">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error.message || "Oops, something went sideways 🙃 — please try again!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
