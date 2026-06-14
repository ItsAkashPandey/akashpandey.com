"use client";

import type {
  ChatAction,
  ChatMessageShape,
  ChatUiCard,
} from "@/lib/chat-types";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

type ChatPanelProps = {
  isExpanded: boolean;
};

export default function ChatPanel({ isExpanded }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageShape[]>([]);
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

    const greeting =
      "Hi, I’m kasi. Ask me about Akash’s research, activities, publications, skills, or contact details.";

    setMessages([
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-assistant-greeting`,
        role: "assistant",
        content: greeting,
        actions: [
          {
            label: "Recent activities",
            prompt: "What are Akash's recent activities?",
            kind: "prompt",
          },
          { label: "Publications", href: "/publications", kind: "page" },
          { label: "Contact", href: "/contact", kind: "page" },
        ],
      },
    ]);
  }, [isExpanded]);

  const handleInputChange = useCallback(
    (
      event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setInput(event.target.value);
    },
    [],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessageText = useCallback(
    async (text: string) => {
      const trimmedInput = text.trim();
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
            message: trimmedInput,
            history: messagesRef.current
              .slice(-8)
              .map(({ role, content }) => ({ role, content })),
            conversationId: conversationIdRef.current,
            visitorName: visitorName || undefined,
            client: {
              page:
                typeof window !== "undefined"
                  ? window.location.pathname
                  : undefined,
            },
          }),
        });

        if (!response.ok) {
          // Parse the friendly error from the server
          let friendlyMessage =
            "Oops, something went sideways 🙃 — please try again!";
          try {
            const errorData = await response.json();
            if (errorData?.error && typeof errorData.error === "string") {
              friendlyMessage = errorData.error;
            }
          } catch {
            // If JSON parsing fails, use generic message
          }
          throw new Error(friendlyMessage);
        }

        const data = (await response.json()) as {
          reply?: string;
          visitorName?: string | null;
          actions?: ChatAction[];
          cards?: ChatUiCard[];
        };
        const assistantText =
          data.reply?.trim() || "Sorry, I don't have an answer for that.";

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
            actions: data.actions,
            cards: data.cards,
          },
        ]);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error("Unknown error"),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, visitorName],
  );

  const handleSubmit = useCallback(
    async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      await sendMessageText(input);
    },
    [input, sendMessageText],
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
        onPromptClick={(prompt) => sendMessageText(prompt)}
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
