"use client";

import type {
  ChatMessageShape,
  ChatStreamEvent,
  ChatUiCard,
} from "@/lib/chat-types";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

const STORAGE_KEY = "kasi-chat-v1";
const GREETING_ID = "kasi-greeting";

const greeting = (): ChatMessageShape => ({
  id: GREETING_ID,
  role: "assistant",
  content:
    "Hi, I'm Kasi. Ask me about Akash's research, activities, publications, skills, or how to reach him.",
  actions: [
    {
      label: "Recent activities",
      prompt: "What has Akash been up to recently?",
      kind: "prompt",
    },
    { label: "Publications", href: "/publications", kind: "page" },
    { label: "Contact", href: "/contact", kind: "page" },
  ],
});

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

type Stored = {
  conversationId: string;
  visitorName: string;
  messages: ChatMessageShape[];
};

/** The conversation survives reloads and page changes within the tab. */
function loadConversation(): Stored | null {
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Stored | null;
    if (!stored?.conversationId || !Array.isArray(stored.messages)) return null;
    return {
      ...stored,
      // A reply that was mid-stream when the page went away stays as it was.
      messages: stored.messages
        .filter((message) => message.content || !message.pending)
        .map((message) => ({ ...message, pending: false })),
    };
  } catch {
    return null;
  }
}

function saveConversation(stored: Stored) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private mode or storage full: the chat still works, it just won't
    // survive a reload.
  }
}

export default function ChatPanel({ isExpanded }: { isExpanded: boolean }) {
  const [messages, setMessages] = useState<ChatMessageShape[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const conversationIdRef = useRef("");
  const messagesRef = useRef(messages);
  const restoredRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Restore (or start) the conversation on first open.
  useEffect(() => {
    if (!isExpanded || restoredRef.current) return;
    restoredRef.current = true;
    const stored = loadConversation();
    conversationIdRef.current = stored?.conversationId ?? newId();
    setVisitorName(stored?.visitorName ?? "");
    setMessages(stored?.messages.length ? stored.messages : [greeting()]);
  }, [isExpanded]);

  useEffect(() => {
    if (!restoredRef.current) return;
    saveConversation({
      conversationId: conversationIdRef.current,
      visitorName,
      messages,
    });
  }, [messages, visitorName]);

  const updateMessage = useCallback(
    (id: string, patch: (message: ChatMessageShape) => ChatMessageShape) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === id ? patch(message) : message,
        ),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isLoading) return;

      const history = messagesRef.current
        .filter((message) => message.id !== GREETING_ID && !message.pending)
        .slice(-8)
        .map(({ role, content, signature }) => ({ role, content, signature }));

      const assistantId = newId();
      setMessages((previous) => [
        ...previous,
        { id: newId(), role: "user", content },
        { id: assistantId, role: "assistant", content: "", pending: true },
      ]);
      setInput("");
      setIsLoading(true);
      setError(null);

      const fail = (message: string) => {
        setError(message);
        setMessages((previous) =>
          previous.filter((item) => item.id !== assistantId || item.content),
        );
        updateMessage(assistantId, (message) => ({
          ...message,
          pending: false,
        }));
      };

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history,
            conversationId: conversationIdRef.current,
            visitorName: visitorName || undefined,
            client: { page: window.location.pathname },
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          fail(data?.error ?? "Something went wrong. Please try again.");
          return;
        }

        const namedVisitor = response.headers.get("X-Kasi-Visitor");
        if (namedVisitor && !visitorName) {
          setVisitorName(decodeURIComponent(namedVisitor));
        }

        if (
          response.headers.get("Content-Type")?.includes("application/json")
        ) {
          const data = (await response.json()) as {
            reply?: string;
            visitorName?: string | null;
            signature?: string;
          };
          if (data.visitorName && !visitorName)
            setVisitorName(data.visitorName);
          updateMessage(assistantId, (message) => ({
            ...message,
            content:
              data.reply?.trim() || "Sorry, I don't have an answer for that.",
            signature: data.signature,
            pending: false,
          }));
          return;
        }

        // Streamed answer: NDJSON events. Text is painted at most once per
        // frame, so a fast stream doesn't re-render Markdown for every token.
        const reader = response
          .body!.pipeThrough(new TextDecoderStream())
          .getReader();
        let buffer = "";
        let pendingText = "";
        let frame = 0;
        const flush = () => {
          frame = 0;
          if (!pendingText) return;
          const text = pendingText;
          pendingText = "";
          updateMessage(assistantId, (message) => ({
            ...message,
            content: message.content + text,
          }));
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          let newline: number;
          while ((newline = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (!line) continue;
            const event = JSON.parse(line) as ChatStreamEvent;
            if (event.type === "delta") {
              pendingText += event.text;
              frame ||= requestAnimationFrame(flush);
            } else if (event.type === "done") {
              cancelAnimationFrame(frame);
              flush();
              updateMessage(assistantId, (message) => ({
                ...message,
                content: message.content.trim(),
                cards: event.cards as ChatUiCard[] | undefined,
                signature: event.signature,
                pending: false,
              }));
            } else if (event.type === "error") {
              cancelAnimationFrame(frame);
              flush();
              fail(event.error);
            }
          }
        }
        cancelAnimationFrame(frame);
        flush();
        updateMessage(assistantId, (message) => ({
          ...message,
          pending: false,
        }));
      } catch {
        fail("Could not reach Kasi. Check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, updateMessage, visitorName],
  );

  const clearChat = () => {
    conversationIdRef.current = newId();
    setMessages([greeting()]);
    setError(null);
    setVisitorName("");
  };

  if (!isExpanded) return null;

  const hasQuestions = messages.some((message) => message.role === "user");

  return (
    <>
      <ChatMessages
        messages={messages}
        error={error}
        showPrompts={!hasQuestions && !isLoading}
        onPromptClick={sendMessage}
      />
      <ChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={() => void sendMessage(input)}
        onClearChat={clearChat}
        isLoading={isLoading}
        canClear={hasQuestions}
      />
    </>
  );
}
