/**
 * Two ink families run through the whole plate: ochre for people and places,
 * teal for anything orbital. The markers are the ochre end of that pairing.
 */
export function createLocationMarkerElement(kind: "akash" | "visitor") {
  const element = document.createElement("button");
  element.type = "button";
  element.title = kind === "akash" ? "Akash's location" : "Your location";
  element.setAttribute(
    "aria-label",
    kind === "akash" ? "Akash's location" : "Your location",
  );
  element.className =
    "group/location relative flex size-8 items-center justify-center border-0 bg-transparent p-0";

  const ring = document.createElement("span");
  ring.className =
    kind === "akash"
      ? "absolute size-5 rounded-full border border-[#9c5b23]/50 bg-[#c98a3e]/15 dark:border-[#e6b678]/55"
      : "absolute size-5 rounded-full border border-[#1f5457]/50 bg-[#2c6a6d]/15 dark:border-[#9adcd5]/55";

  const dot = document.createElement("span");
  dot.className =
    kind === "akash"
      ? "relative size-2.5 rounded-full border-2 border-[#f4f1e8] bg-[#9c5b23] shadow-md dark:border-[#1b2429] dark:bg-[#e6b678]"
      : "relative size-2.5 rounded-full border-2 border-[#f4f1e8] bg-[#1f5457] shadow-md dark:border-[#1b2429] dark:bg-[#9adcd5]";

  const label = document.createElement("span");
  label.textContent = kind === "akash" ? "Akash" : "You";
  label.className =
    "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-[3px] bg-[#1b2429]/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide whitespace-nowrap text-[#f4f1e8] opacity-0 shadow-sm transition-opacity group-hover/location:opacity-100 group-focus-visible/location:opacity-100";

  element.append(ring, dot, label);
  return element;
}

/**
 * The third mark: everywhere a talk, camera install or startup showcase
 * happened. It needs to read as "there's something here" at a glance
 * against the quiet paper basemap, so it gets a held pulse and its own
 * ink (`--activity-accent`) rather than the muted tone a footnote marker
 * would normally get.
 */
export function createActivityMarkerElement(count: number, label: string) {
  const element = document.createElement("button");
  element.type = "button";
  const title =
    count > 1 ? `${count} activities near ${label}` : `1 activity near ${label}`;
  element.title = title;
  element.setAttribute("aria-label", title);
  element.className =
    "group/activity relative flex size-7 items-center justify-center border-0 bg-transparent p-0";

  const pulse = document.createElement("span");
  pulse.className =
    "activity-marker-pulse absolute size-4 rounded-full bg-[hsl(var(--activity-accent))]/35";

  const dot = document.createElement("span");
  dot.className =
    "relative size-3 rounded-full border-2 border-[#f4f1e8] bg-[hsl(var(--activity-accent))] shadow-[0_1px_4px_rgba(0,0,0,0.35)] transition-transform duration-150 group-hover/activity:scale-125 dark:border-[#1b2429]";

  element.append(pulse, dot);

  if (count > 1) {
    const badge = document.createElement("span");
    badge.textContent = count > 9 ? "9+" : String(count);
    badge.className =
      "pointer-events-none absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full border border-[#f4f1e8] bg-[#1b2429] text-[8px] leading-none font-bold text-[#f4f1e8] dark:border-[#1b2429] dark:bg-[#f4f1e8] dark:text-[#1b2429]";
    element.append(badge);
  }

  const tooltip = document.createElement("span");
  tooltip.textContent = label;
  tooltip.className =
    "pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-[3px] bg-[#1b2429]/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide whitespace-nowrap text-[#f4f1e8] opacity-0 shadow-sm transition-opacity group-hover/activity:opacity-100 group-focus-visible/activity:opacity-100";
  element.append(tooltip);

  return element;
}
