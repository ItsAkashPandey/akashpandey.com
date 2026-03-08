import { ChatRequestOptions } from "ai";
import { SendHorizontal, Trash } from "lucide-react";
import { HTMLAttributes } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface ChatInputProps extends HTMLAttributes<HTMLFormElement> {
  input: string;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  setMessages: (
    messages:
      | Array<{ id: string; role: "user" | "assistant"; content: string }>
      | ((
        messages: Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
        }>,
      ) => Array<{ id: string; role: "user" | "assistant"; content: string }>),
  ) => void;
  onClearChat?: () => void;
  isLoading: boolean;
  messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
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
      className="flex gap-1.5 border-t border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-2 py-2 backdrop-blur-md sm:gap-2 sm:px-3 sm:py-2.5"
    >
      <Button
        title="Clear chat"
        variant="outline"
        onClick={() => {
          setMessages([]);
          onClearChat?.();
        }}
        className="h-9 px-3 py-2 touch-target sm:h-10 sm:px-4 sm:py-2.5 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border-white/20 dark:border-white/10"
        disabled={messages.length === 0}
        type="button"
      >
        <Trash className="size-4 text-rose-500 sm:size-5" />
      </Button>
      <Input
        autoFocus
        placeholder="Ask something..."
        value={input}
        onChange={handleInputChange}
        className="h-8 text-base bg-transparent border-white/20 dark:border-white/10 focus-visible:ring-primary/30 sm:h-9 sm:text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button
        title="Send message"
        variant="default"
        className="h-9 px-3 py-2 touch-target sm:h-10 sm:px-4 sm:py-2.5"
        disabled={input.length === 0}
        type="submit"
      >
        <SendHorizontal className="size-4 sm:size-5" />
      </Button>
    </form>
  );
}
