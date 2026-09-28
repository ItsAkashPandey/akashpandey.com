const ITEMS = [
  { label: "Activities", color: "hsl(var(--activity-accent))" },
  { label: "Education", color: "hsl(var(--education-accent))" },
  { label: "Work", color: "hsl(var(--experience-accent))" },
];

/** What the pin colours mean. Sits under the map, not on top of it. */
export default function MapLegend() {
  return (
    <ul
      aria-label="Map legend"
      className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs"
    >
      {ITEMS.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="border-background size-2.5 rounded-full border shadow-sm"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="border-warm size-3 rounded-full border-2 bg-transparent"
        />
        Akash
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="bg-background text-foreground ring-ink/40 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold ring-2"
        >
          3
        </span>
        Several places, select to zoom in
      </li>
    </ul>
  );
}
