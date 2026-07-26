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
      ? "absolute size-5 rounded-full border border-orange-700/45 bg-orange-500/12 dark:border-orange-300/50"
      : "absolute size-5 rounded-full border border-sky-700/45 bg-sky-500/12 dark:border-sky-300/50";

  const dot = document.createElement("span");
  dot.className =
    kind === "akash"
      ? "relative size-2.5 rounded-full border-2 border-white bg-orange-700 shadow-md dark:border-zinc-800 dark:bg-orange-300"
      : "relative size-2.5 rounded-full border-2 border-white bg-sky-700 shadow-md dark:border-zinc-800 dark:bg-sky-300";

  const label = document.createElement("span");
  label.textContent = kind === "akash" ? "Akash" : "You";
  label.className =
    "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 bg-zinc-950/88 px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity group-hover/location:opacity-100 group-focus-visible/location:opacity-100";

  element.append(ring, dot, label);
  return element;
}
