import KasiMark from "./KasiMark";

type ChatHeaderProps = {
  compact?: boolean;
};

export default function ChatHeader({ compact = false }: ChatHeaderProps) {
  return (
    <span className="flex w-full min-w-0 items-center justify-start gap-3">
      <KasiMark active size={compact ? "md" : "lg"} />
      <span className="flex min-w-0 flex-col items-start">
        <span className="truncate text-sm leading-tight font-semibold">
          {compact ? "Ask Kasi" : "Kasi"}
        </span>
        <span className="text-muted-foreground mt-1 flex items-center gap-1.5 truncate text-[11px] leading-none">
          <span aria-hidden className="bg-tone-green size-1.5 rounded-full" />
          {compact ? "Portfolio guide" : "Akash's portfolio guide"}
        </span>
      </span>
    </span>
  );
}
