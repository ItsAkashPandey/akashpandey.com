import KasiMark from "./KasiMark";

type ChatHeaderProps = {
  compact?: boolean;
};

export default function ChatHeader({ compact = false }: ChatHeaderProps) {
  return (
    <section className="flex w-full min-w-0 items-center justify-start gap-3">
      <KasiMark active size={compact ? "md" : "lg"} />
      <div
        className={
          compact
            ? "hidden min-w-0 flex-col items-start sm:flex"
            : "flex min-w-0 flex-col items-start"
        }
      >
        <p className="truncate text-sm leading-tight font-semibold">
          {compact ? "Ask Kasi" : "Kasi"}
        </p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 truncate text-[10px] leading-none">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {compact ? "Portfolio guide" : "Akash’s portfolio guide"}
        </p>
      </div>
    </section>
  );
}
