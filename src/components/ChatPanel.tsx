"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

type ChatPanelProps = {
  isExpanded: boolean;
};

export default function ChatPanel({ isExpanded }: ChatPanelProps) {
  const [messages, setMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const messagesRef = useRef(messages);
  const conversationIdRef = useRef(
    crypto.randomUUID?.() ?? `${Date.now()}-conversation`,
  );
  const [visitorName, setVisitorName] = useState("");
  // visitorName is optional and is inferred by the server (Gemini) when possible.

  useEffect(() => {
    if (!isExpanded) return;
    if (messagesRef.current.length > 0) return;

    const greeting = "Hey — I’m kasi. What should I call you?";

    setMessages([
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-assistant-greeting`,
        role: "assistant",
        content: greeting,
      },
    ]);
  }, [isExpanded]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    [],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleSubmit = useCallback(
    async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      const trimmedInput = input.trim();
      if (!trimmedInput || isLoading) {
        return;
      }

      const userMessage = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-user`,
        role: "user" as const,
        content: trimmedInput,
      };

      const nextMessages = [...messagesRef.current, userMessage];
      setMessages(nextMessages);
      setInput("");
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            conversationId: conversationIdRef.current,
            visitorName: visitorName || undefined,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to fetch response.");
        }

        const data = (await response.json()) as {
          reply?: string;
          visitorName?: string | null;
        };
        const assistantText = data.reply?.trim() || "Sorry, I don't have an answer for that.";

        const nextVisitorName = (data.visitorName || "").trim();
        if (nextVisitorName && !visitorName) {
          setVisitorName(nextVisitorName);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID?.() ?? `${Date.now()}-assistant`,
            role: "assistant",
            content: assistantText,
          },
        ]);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, visitorName],
  );

  const handleClearChat = () => {
    setMessages([]);
    setError(undefined);
    setVisitorName("");
    conversationIdRef.current =
      crypto.randomUUID?.() ?? `${Date.now()}-conversation`;
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <>
      <ChatMessages
        messages={messages}
        error={error}
        isLoading={isLoading}
        onPromptClick={(prompt) =>
          handleInputChange({
            target: { value: prompt },
          } as ChangeEvent<HTMLInputElement>)
        }
      />
      <ChatInput
        input={input}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        setMessages={setMessages}
        onClearChat={handleClearChat}
        isLoading={isLoading}
        messages={messages}
      />
    </>
  );
}
