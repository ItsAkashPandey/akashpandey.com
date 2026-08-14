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
 * A third, quieter mark for everywhere a talk, camera install or startup
 * showcase happened — small enough not to compete with the Akash/visitor
 * pair, one shared slate tone rather than the ochre/teal pairing above.
 */
export function createActivityMarkerElement(count: number) {
  const element = document.createElement("button");
  element.type = "button";
  const title =
    count > 1 ? `${count} activities here` : "1 activity here";
  element.title = title;
  element.setAttribute("aria-label", title);
  element.className =
    "group/activity relative flex size-5 items-center justify-center border-0 bg-transparent p-0";

  const dot = document.createElement("span");
  dot.className =
    "relative size-1.5 rounded-full border border-[#f4f1e8] bg-[#5b6a5e] shadow-sm transition-transform group-hover/activity:scale-125 dark:border-[#1b2429] dark:bg-[#93a7b3]";

  element.append(dot);
  return element;
}
