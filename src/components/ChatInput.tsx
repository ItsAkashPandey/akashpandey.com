import { LoaderCircle, SendHorizontal, Trash } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "./ui/Button";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onClearChat: () => void;
  isLoading: boolean;
  canClear: boolean;
}

export default function ChatInput({
  input,
  onInputChange,
  onSubmit,
  onClearChat,
  isLoading,
  canClear,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow with the text, up to the max height, then scroll.
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [input]);

  // Focus on open with a mouse or trackpad, but not on touch screens, where
  // focusing throws the keyboard up over the conversation.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, []);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="kasi-divider border-t px-3 py-3"
    >
      <div className="bg-background/70 focus-within:ring-ink/20 border-border/60 flex items-end gap-2 rounded-lg border p-2 shadow-sm ring-0 transition focus-within:ring-4">
        <Button
          title="Clear chat"
          aria-label="Clear chat"
          variant="ghost"
          onClick={onClearChat}
          className="text-tone-rose hover:bg-tone-rose/10 size-10 shrink-0 rounded-md"
          disabled={!canClear || isLoading}
          type="button"
        >
          <Trash className="size-4" />
        </Button>
        <label htmlFor="kasi-input" className="sr-only">
          Message Kasi
        </label>
        <textarea
          id="kasi-input"
          ref={textareaRef}
          placeholder="Ask about Akash..."
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          rows={1}
          maxLength={2000}
          className="ios-prevent-zoom placeholder:text-muted-foreground max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none"
          onKeyDown={(event) => {
            // Enter while an IME is composing (Hindi, Chinese, Japanese...)
            // confirms the word; it must not send a half-typed message.
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
        <Button
          title="Send message"
          aria-label="Send message"
          variant="default"
          className="size-10 shrink-0 rounded-md"
          disabled={input.trim().length === 0 || isLoading}
          type="submit"
        >
          {isLoading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
