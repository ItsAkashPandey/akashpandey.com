export type ChatRole = "user" | "assistant";

export type ChatAction = {
  label: string;
  href?: string;
  prompt?: string;
  kind?: "page" | "external" | "email" | "prompt";
};

export type ChatUiCard = {
  title: string;
  subtitle?: string;
  href?: string;
  meta?: string;
};

export type ChatMessageShape = {
  id: string;
  role: ChatRole;
  content: string;
  actions?: ChatAction[];
  cards?: ChatUiCard[];
  /** Server signature on Kasi's replies; see lib/chat-signing.ts. */
  signature?: string;
  /** Still streaming in. */
  pending?: boolean;
};

export type ChatHistoryMessage = {
  role: ChatRole;
  content: string;
  signature?: string;
};

/** One line of the chat route's NDJSON stream. */
export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; cards?: ChatUiCard[]; signature?: string }
  | { type: "error"; error: string };
