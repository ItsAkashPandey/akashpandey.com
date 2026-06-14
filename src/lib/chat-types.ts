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
};

export type ChatHistoryMessage = {
  role: ChatRole;
  content: string;
};
