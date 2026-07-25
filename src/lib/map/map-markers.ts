type SatelliteMarkerElement = {
  element: HTMLButtonElement;
  setBearing: (bearing: number) => void;
  setSelected: (selected: boolean) => void;
};

function createSolarPanel(side: "left" | "right") {
  const array = document.createElement("span");
  array.className = "relative block h-[15px] w-[23px]";
  array.style.transform =
    side === "left"
      ? "perspective(72px) rotateY(22deg) rotateZ(-2deg)"
      : "perspective(72px) rotateY(-22deg) rotateZ(2deg)";
  array.style.transformOrigin =
    side === "left" ? "right center" : "left center";

  const edge = document.createElement("span");
  edge.className =
    "absolute inset-0 rounded-[1px] border border-[#0d2735] bg-[#102f41]";
  edge.style.transform = "translate(1.5px, 1.5px)";

  const panel = document.createElement("span");
  panel.className =
    "absolute inset-0 grid grid-cols-3 grid-rows-2 gap-px rounded-[1px] border border-sky-100/80 bg-[#b8d5df] p-px";
  panel.style.boxShadow =
    side === "left"
      ? "-2px 3px 5px rgb(2 27 43 / 0.38)"
      : "2px 3px 5px rgb(2 27 43 / 0.38)";

  for (let index = 0; index < 6; index += 1) {
    const cell = document.createElement("span");
    cell.className = "border border-[#123a50]/45";
    cell.style.background =
      index % 3 === 0
        ? "linear-gradient(135deg, #73adc3 0%, #2c6e90 42%, #183e5b 100%)"
        : "linear-gradient(135deg, #5799b6 0%, #245f82 48%, #153650 100%)";
    cell.style.boxShadow = "inset 1px 1px 0 rgb(224 242 254 / 0.25)";
    panel.append(cell);
  }

  array.append(edge, panel);
  return array;
}

function createSatelliteBus() {
  const bus = document.createElement("span");
  bus.className = "relative h-5 w-4 shrink-0";

  const front = document.createElement("span");
  front.className =
    "absolute inset-[1px] rounded-[1px] border border-amber-100/75";
  front.style.background =
    "linear-gradient(135deg, #fff0bc 0%, #d89d42 34%, #9a5e21 68%, #55341b 100%)";
  front.style.boxShadow =
    "inset 1px 1px 0 rgb(255 250 226 / 0.7), inset -1px -1px 0 rgb(70 38 14 / 0.45), 0 3px 5px rgb(20 26 29 / 0.42)";

  const top = document.createElement("span");
  top.className =
    "absolute -top-[2px] left-[3px] h-[4px] w-[12px] border-t border-amber-50/75 bg-[#f3d796]";
  top.style.transform = "skewX(-38deg)";

  const side = document.createElement("span");
  side.className =
    "absolute top-[2px] -right-[3px] h-[15px] w-[4px] border-r border-amber-950/60 bg-[#70411d]";
  side.style.transform = "skewY(-38deg)";

  const lens = document.createElement("span");
  lens.className =
    "absolute top-[7px] left-[6px] size-[4px] rounded-full border border-cyan-50/80 bg-[#235868] shadow-[inset_1px_1px_0_rgb(207_250_254/0.65)]";

  const leftHinge = document.createElement("span");
  leftHinge.className =
    "absolute top-[9px] -left-[4px] h-[3px] w-[5px] bg-gradient-to-b from-zinc-200 to-zinc-500";

  const rightHinge = document.createElement("span");
  rightHinge.className =
    "absolute top-[9px] -right-[6px] h-[3px] w-[5px] bg-gradient-to-b from-zinc-200 to-zinc-600";

  const mast = document.createElement("span");
  mast.className =
    "absolute -top-[10px] left-[8px] h-[11px] w-px -translate-x-1/2 bg-gradient-to-b from-zinc-100 to-zinc-500 shadow-sm";

  const dish = document.createElement("span");
  dish.className =
    "absolute -top-[13px] left-[7px] h-[7px] w-[12px] rounded-[50%] border border-zinc-100/90";
  dish.style.background =
    "radial-gradient(circle at 32% 30%, #f8fafc 0%, #a9b2b8 42%, #4b5560 100%)";
  dish.style.transform = "perspective(30px) rotateX(28deg) rotate(-22deg)";
  dish.style.boxShadow =
    "inset 1px 1px 0 rgb(255 255 255 / 0.68), 1px 2px 2px rgb(15 23 42 / 0.35)";

  const dishArm = document.createElement("span");
  dishArm.className =
    "absolute -top-[10px] left-[11px] h-[7px] w-px bg-zinc-200";
  dishArm.style.transform = "rotate(-22deg)";

  const feedHorn = document.createElement("span");
  feedHorn.className =
    "absolute -top-[12px] left-[13px] size-[3px] rounded-full border border-zinc-100 bg-zinc-600 shadow-sm";

  bus.append(
    front,
    top,
    side,
    lens,
    leftHinge,
    rightHinge,
    mast,
    dish,
    dishArm,
    feedHorn,
  );
  return bus;
}

export function createSatelliteMarkerElement(
  name: string,
): SatelliteMarkerElement {
  const element = document.createElement("button");
  element.type = "button";
  element.title = `Show ${name} orbit`;
  element.setAttribute("aria-label", `Show ${name} orbit`);
  element.dataset.selected = "false";
  element.className =
    "group/satellite relative h-16 w-20 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500";

  const label = document.createElement("span");
  label.textContent = name;
  label.className =
    "pointer-events-none absolute top-0 left-1/2 z-30 -translate-x-1/2 -translate-y-full rounded-md bg-zinc-950/90 px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover/satellite:opacity-100";

  const connector = document.createElement("span");
  connector.className =
    "pointer-events-none absolute top-[32px] bottom-[5px] left-1/2 border-l border-dashed border-cyan-700/55 dark:border-cyan-300/55";

  const groundPoint = document.createElement("span");
  groundPoint.className =
    "pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 rounded-full border border-white bg-cyan-700 shadow-sm dark:border-zinc-900 dark:bg-cyan-300";

  const halo = document.createElement("span");
  halo.className =
    "pointer-events-none absolute bottom-[-4px] left-1/2 size-4 -translate-x-1/2 rounded-full border border-cyan-500/0 opacity-0 transition-all";

  const model = document.createElement("span");
  model.className =
    "pointer-events-none absolute top-3 left-1/2 z-20 transition-[transform,filter] duration-500 ease-linear";

  const assembly = document.createElement("span");
  assembly.className =
    "flex items-center gap-1 transition-transform duration-200";
  assembly.style.filter = "saturate(0.86) contrast(1.08)";
  assembly.append(
    createSolarPanel("left"),
    createSatelliteBus(),
    createSolarPanel("right"),
  );
  model.append(assembly);
  element.append(label, connector, groundPoint, halo, model);

  return {
    element,
    setBearing: (bearing) => {
      model.style.transform = `translateX(-50%) rotate(${bearing}deg)`;
    },
    setSelected: (selected) => {
      element.dataset.selected = String(selected);
      label.style.opacity = selected ? "1" : "";
      halo.style.borderColor = selected
        ? "rgb(34 211 238 / 0.65)"
        : "transparent";
      halo.style.opacity = selected ? "1" : "0";
      halo.style.transform = selected
        ? "translateX(-50%) scale(1.2)"
        : "translateX(-50%) scale(1)";
      model.style.filter = selected
        ? "drop-shadow(0 3px 6px rgb(8 145 178 / 0.62))"
        : "drop-shadow(0 2px 3px rgb(15 23 42 / 0.32))";
      assembly.style.transform = selected ? "scale(1.08)" : "scale(1)";
    },
  };
}

export function createLocationMarkerElement(kind: "akash" | "visitor") {
  const element = document.createElement("button");
  element.type = "button";
  element.title = kind === "akash" ? "Akash's location" : "Your location";
  element.setAttribute(
    "aria-label",
    kind === "akash" ? "Akash's location" : "Your location",
  );
  element.className =
    "group/location relative flex size-9 items-center justify-center border-0 bg-transparent p-0";

  const ring = document.createElement("span");
  ring.className =
    kind === "akash"
      ? "absolute size-6 rounded-full border border-orange-700/35 bg-orange-500/10"
      : "absolute size-6 rounded-full border border-sky-700/35 bg-sky-500/10";

  const dot = document.createElement("span");
  dot.className =
    kind === "akash"
      ? "relative size-2.5 rounded-full border-2 border-white bg-orange-700 shadow-md dark:border-zinc-800 dark:bg-orange-400"
      : "relative size-2.5 rounded-full border-2 border-white bg-sky-700 shadow-md dark:border-zinc-800 dark:bg-sky-300";

  const label = document.createElement("span");
  label.textContent = kind === "akash" ? "Akash" : "You";
  label.className =
    "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-md bg-zinc-950/90 px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover/location:opacity-100";

  element.append(ring, dot, label);
  return element;
}
