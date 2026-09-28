import type { ChatMessageShape } from "@/lib/chat-types";
import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatPrompts from "./ChatPrompts";

interface ChatMessagesProps {
  messages: ChatMessageShape[];
  error: string | null;
  /** The "Try asking" suggestions, shown until the first question. */
  showPrompts: boolean;
  onPromptClick: (prompt: string) => void;
}

export default function ChatMessages({
  messages,
  error,
  showPrompts,
  onPromptClick,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Follow the conversation, including a reply that is still streaming in,
  // unless the reader has scrolled up to reread something.
  useEffect(() => {
    const node = scrollRef.current;
    if (node && stickToBottom.current) {
      node.scrollTo({ top: node.scrollHeight });
    }
  }, [messages, error]);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const node = event.currentTarget;
        stickToBottom.current =
          node.scrollHeight - node.scrollTop - node.clientHeight < 48;
      }}
      className="h-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain p-3 sm:p-4"
      role="log"
      aria-live="polite"
      aria-label="Conversation with Kasi"
    >
      <ul className="space-y-3">
        {messages.map((message) => (
          <li key={message.id}>
            <ChatMessage message={message} onPromptClick={onPromptClick} />
          </li>
        ))}
      </ul>

      {showPrompts && <ChatPrompts onPromptClick={onPromptClick} />}

      {error && (
        <div className="flex flex-col items-center gap-2 py-3" role="alert">
          <div className="border-tone-rose/20 bg-tone-rose/10 max-w-[280px] rounded-lg border px-4 py-3 text-center">
            <p className="text-tone-rose text-xs font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
