import { cn } from "@/lib/utils";
import type { ChatAction, ChatMessageShape } from "@/lib/chat-types";
import { ArrowUpRight, Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageShape;
  onPromptClick?: (prompt: string) => void;
}

function ActionLink({
  action,
  onPromptClick,
}: {
  action: ChatAction;
  onPromptClick?: (prompt: string) => void;
}) {
  const content = (
    <>
      <span>{action.label}</span>
      {action.href && <ArrowUpRight className="size-3.5" />}
    </>
  );

  if (action.prompt && !action.href) {
    return (
      <button
        type="button"
        onClick={() => onPromptClick?.(action.prompt!)}
        className="bg-primary/10 text-primary hover:bg-primary/15 rounded-full px-3 py-1 text-xs font-medium transition"
      >
        {action.label}
      </button>
    );
  }

  if (!action.href) return null;

  const className =
    "inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium transition hover:bg-background";

  if (action.href.startsWith("/")) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={action.href}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {content}
    </a>
  );
}

export default function ChatMessage({
  message,
  onPromptClick,
}: ChatMessageProps) {
  const { role, content, actions, cards } = message;
  const isBot = role === "assistant";

  return (
    <div
      className={cn(
        "flex items-start",
        isBot ? "justify-start" : "justify-end",
      )}
    >
      {isBot && (
        <div className="bg-background/70 mt-0.5 mr-2 flex size-7 shrink-0 items-center justify-center rounded-xl border shadow-sm">
          <Bot className="text-primary size-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[86%] min-w-0 rounded-2xl border px-3.5 py-2.5 text-sm break-words shadow-sm sm:max-w-[330px]",
          isBot
            ? "border-white/30 bg-white/55 backdrop-blur-md dark:border-white/10 dark:bg-white/10"
            : "bg-primary text-primary-foreground border-primary shadow-md",
        )}
      >
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, href = "", ...props }) =>
              href.startsWith("/") ? (
                <Link
                  href={href}
                  className="break-words underline underline-offset-2"
                  {...props}
                />
              ) : (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="break-words underline underline-offset-2"
                  {...props}
                />
              ),
            p: ({ node, ...props }) => (
              <p className="mt-3 first:mt-0" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul
                className="mt-3 list-inside list-disc first:mt-0"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="mt-3 list-inside list-decimal first:mt-0"
                {...props}
              />
            ),
            table: ({ node, ...props }) => (
              <div className="mt-3 overflow-hidden rounded-xl border first:mt-0">
                <table className="w-full text-left text-xs" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="bg-muted px-2 py-1.5 font-semibold" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border-t px-2 py-1.5 align-top" {...props} />
            ),
          }}
        >
          {content || ""}
        </Markdown>

        {cards && cards.length > 0 && (
          <div className="mt-3 grid gap-2">
            {cards.slice(0, 3).map((card) => {
              const body = (
                <span className="bg-background/65 hover:bg-background block rounded-xl border p-3 transition">
                  <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                    <Sparkles className="text-primary size-3" />
                    {card.title}
                  </span>
                  {card.meta && (
                    <span className="text-muted-foreground mt-1 block text-[11px]">
                      {card.meta}
                    </span>
                  )}
                  {card.subtitle && (
                    <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs">
                      {card.subtitle}
                    </span>
                  )}
                </span>
              );

              return card.href?.startsWith("/") ? (
                <Link key={`${card.title}-${card.href}`} href={card.href}>
                  {body}
                </Link>
              ) : card.href ? (
                <a
                  key={`${card.title}-${card.href}`}
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {body}
                </a>
              ) : (
                <span key={card.title}>{body}</span>
              );
            })}
          </div>
        )}

        {isBot && actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.slice(0, 4).map((action) => (
              <ActionLink
                key={action.href || action.prompt || action.label}
                action={action}
                onPromptClick={onPromptClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
