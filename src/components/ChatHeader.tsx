import { MessageCircle, Sparkles } from "lucide-react";

type ChatHeaderProps = {
  compact?: boolean;
};

export default function ChatHeader({ compact = false }: ChatHeaderProps) {
  return (
    <section
      className={`flex w-full items-center gap-3 ${compact ? "justify-center" : "justify-start"}`}
    >
      <div className="from-primary/18 to-primary/5 ring-primary/20 relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1">
        <MessageCircle className="text-primary size-5" />
        <span className="bg-background absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border shadow-sm">
          <Sparkles className="text-primary size-3" />
        </span>
      </div>
      <div className={`${compact ? "hidden" : "flex"} flex-col items-start`}>
        <p className="text-muted-foreground text-xs">Ask the website</p>
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          <p className="text-sm font-semibold">kasi</p>
        </div>
      </div>
    </section>
  );
}
