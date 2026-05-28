import { Bot } from "lucide-react";

type ChatHeaderProps = {
  compact?: boolean;
};

export default function ChatHeader({ compact = false }: ChatHeaderProps) {
  return (
    <section
      className={`flex w-full items-center gap-3 ${compact ? "justify-center sm:justify-start" : "justify-start"}`}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
        <Bot className="size-5 text-primary" />
      </div>
      <div className={`${compact ? "hidden sm:flex" : "flex"} flex-col items-start`}>
        <p className="text-xs text-muted-foreground">Chat with</p>
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          <p className="text-sm font-medium">kasi</p>
        </div>
      </div>
    </section>
  );
}
