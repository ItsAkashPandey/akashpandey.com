import type { ChatMessageShape } from "@/lib/chat-types";
import { CornerDownLeft, SendHorizontal, Trash } from "lucide-react";
import { HTMLAttributes } from "react";
import { Button } from "./ui/Button";

interface ChatInputProps extends HTMLAttributes<HTMLFormElement> {
  input: string;
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  setMessages: (
    messages:
      | ChatMessageShape[]
      | ((messages: ChatMessageShape[]) => ChatMessageShape[]),
  ) => void;
  onClearChat?: () => void;
  isLoading: boolean;
  messages: ChatMessageShape[];
}

export default function ChatInput({
  input = "",
  handleSubmit,
  handleInputChange,
  setMessages,
  onClearChat,
  isLoading,
  messages,
}: ChatInputProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/20 bg-white/20 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
    >
      <div className="bg-background/70 focus-within:ring-primary/20 flex items-end gap-2 rounded-lg border border-white/30 p-2 shadow-sm ring-0 transition focus-within:ring-4 dark:border-white/10 dark:bg-white/5">
        <Button
          title="Clear chat"
          variant="ghost"
          onClick={() => {
            setMessages([]);
            onClearChat?.();
          }}
          className="size-10 shrink-0 rounded-md text-rose-500 hover:bg-rose-500/10"
          disabled={messages.length === 0}
          type="button"
        >
          <Trash className="size-4" />
        </Button>
        <textarea
          autoFocus
          placeholder="Ask about Akash..."
          value={input}
          onChange={handleInputChange}
          rows={1}
          className="placeholder:text-muted-foreground max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
        />
        <Button
          title="Send message"
          variant="default"
          className="size-10 shrink-0 rounded-md"
          disabled={input.trim().length === 0 || isLoading}
          type="submit"
        >
          {isLoading ? (
            <CornerDownLeft className="size-4 opacity-70" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
