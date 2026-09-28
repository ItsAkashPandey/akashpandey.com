"use client";

import { buttonVariants } from "@/components/ui/Button";
import type { GlobeData, GlobeStop } from "@/lib/globe-data";
import { countLabel, type MarkerCategory } from "@/lib/map/map-types";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMarker, GlobeScene, GlobeTheme } from "./globe-scene";

const ITEMS_SHOWN = 4;
const CATEGORY_ORDER: MarkerCategory[] = [
  "experience",
  "education",
  "activity",
];

/** "28 26% 12%" from a CSS custom property, as numbers. */
function readHsl(
  style: CSSStyleDeclaration,
  name: string,
): [number, number, number] {
  const [h = 0, s = 0, l = 0] = style
    .getPropertyValue(name)
    .trim()
    .split(/\s+/)
    .map((part) => parseFloat(part));
  return [h, s, l];
}

function readTheme(): GlobeTheme {
  const style = getComputedStyle(document.documentElement);
  return {
    land: readHsl(style, "--foreground"),
    fill: readHsl(style, "--card"),
    edge: readHsl(style, "--border"),
    grid: readHsl(style, "--foreground"),
    arc: readHsl(style, "--accent-ink"),
    pulse: readHsl(style, "--accent-warm"),
    home: readHsl(style, "--accent-warm"),
    selected: readHsl(style, "--foreground"),
    activity: readHsl(style, "--activity-accent"),
    education: readHsl(style, "--education-accent"),
    experience: readHsl(style, "--experience-accent"),
  };
}

function markerFor(stop: GlobeStop, index: number): GlobeMarker {
  const weight = stop.items.length;
  const category =
    index === 0
      ? "home"
      : (CATEGORY_ORDER.find((key) => stop.counts[key] > 0) ?? "activity");
  return { id: stop.id, coordinates: stop.coordinates, category, weight };
}

function countsText(stop: GlobeStop) {
  return CATEGORY_ORDER.filter((key) => stop.counts[key] > 0)
    .map((key) => countLabel(key, stop.counts[key]))
    .join(" · ");
}

const distanceFormat = new Intl.NumberFormat("en-IN");

export default function PlacesGlobe({ data }: { data: GlobeData }) {
  const { stops } = data;
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const markers = useMemo(() => stops.map(markerFor), [stops]);
  const indexById = useMemo(
    () => new Map(stops.map((stop, position) => [stop.id, position])),
    [stops],
  );
  const stop = stops[index];
  const indexRef = useRef(index);
  indexRef.current = index;

  // Three.js only loads once the section is close to the screen, and only
  // draws while it is on screen.
  useEffect(() => {
    const frame = frameRef.current;
    const host = canvasHostRef.current;
    if (!frame || !host) return;
    let cancelled = false;
    let scene: GlobeScene | null = null;
    let onScreen = false;
    const cleanups: (() => void)[] = [];

    const setActive = () =>
      scene?.setActive(onScreen && document.visibilityState === "visible");

    const start = async () => {
      const { createGlobeScene } = await import("./globe-scene");
      if (cancelled) return;
      // A fresh canvas each time: a canvas whose WebGL context was released
      // on unmount can't be drawn on again (React mounts twice in dev).
      const canvas = document.createElement("canvas");
      canvas.className = "block size-full touch-pan-y select-none";
      canvas.setAttribute("aria-hidden", "true");
      host.replaceChildren(canvas);
      cleanups.push(() => canvas.remove());
      scene = createGlobeScene({
        canvas,
        markers,
        theme: readTheme(),
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
        onHover: (id, x, y) => setHover(id ? { id, x, y } : null),
        onSelect: (id) => {
          const position = indexById.get(id);
          if (position !== undefined) setIndex(position);
        },
      });
      if (!scene) {
        setFailed(true);
        return;
      }
      sceneRef.current = scene;
      const current = stops[indexRef.current];
      scene.select(current.id);
      scene.focus(current.id, true);

      const resize = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        scene?.resize(width, height);
      });
      resize.observe(canvas);
      cleanups.push(() => resize.disconnect());

      const visible = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        setActive();
      });
      visible.observe(frame);
      cleanups.push(() => visible.disconnect());

      document.addEventListener("visibilitychange", setActive);
      cleanups.push(() =>
        document.removeEventListener("visibilitychange", setActive),
      );

      // next-themes flips the class on <html>; read the colours again.
      const theme = new MutationObserver(() => scene?.setTheme(readTheme()));
      theme.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      cleanups.push(() => theme.disconnect());

      setReady(true);
    };

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        start().catch((error) => {
          console.error("[globe]", error);
          if (!cancelled) setFailed(true);
        });
      },
      { rootMargin: "400px 0px" },
    );
    near.observe(frame);

    return () => {
      cancelled = true;
      near.disconnect();
      scene?.dispose();
      sceneRef.current = null;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [indexById, markers, stops]);

  // Selecting a stop, from the buttons or by clicking a dot, turns the globe.
  const firstFocus = useRef(true);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready) return;
    scene.select(stops[index].id);
    if (firstFocus.current) {
      firstFocus.current = false;
      if (index === 0) return;
    }
    scene.focus(stops[index].id);
  }, [index, ready, stops]);

  const step = useCallback(
    (delta: number) =>
      setIndex((current) => (current + delta + stops.length) % stops.length),
    [stops.length],
  );

  const hovered = hover ? stops[indexById.get(hover.id) ?? -1] : undefined;
  const summary = `${stops.length} cities so far, from ${data.north} to ${data.south}${
    data.abroad.length ? ` and as far as ${data.abroad.join(", ")}` : ""
  }.`;
  const extra = stop.items.length - ITEMS_SHOWN;
  const mapHref = `/contact?city=${stop.id}#map`;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
      <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
        <p className="text-muted-foreground max-w-md text-base text-pretty">
          {summary}
        </p>

        <div aria-live="polite" className="min-h-[19rem]">
          <h3 className="title text-3xl leading-tight sm:text-4xl">
            {stop.city}
            {stop.country !== "India" && (
              <span className="text-muted-foreground">, {stop.country}</span>
            )}
          </h3>
          <p className="text-muted-foreground mt-1.5 text-sm tabular-nums">
            {stop.distanceKm === 0
              ? "Home base"
              : `${distanceFormat.format(stop.distanceKm)} km from Roorkee`}{" "}
            · {countsText(stop)}
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {stop.items.slice(0, ITEMS_SHOWN).map((item) => (
              <li key={`${item.href}-${item.title}`} className="flex flex-col">
                <Link
                  href={item.href}
                  className="hover:text-ink w-fit text-[15px] leading-snug font-semibold text-balance underline-offset-4 transition-colors hover:underline"
                >
                  {item.title}
                </Link>
                <span className="text-muted-foreground text-xs">
                  {item.when} · {item.place}
                </span>
              </li>
            ))}
          </ul>
          {extra > 0 ? (
            <Link
              href={mapHref}
              className="link-ink mt-3 inline-flex items-center gap-1 text-sm font-semibold"
            >
              {extra} more on the map
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          ) : (
            <Link
              href={mapHref}
              className="text-muted-foreground hover:text-ink mt-3 inline-flex items-center gap-1 text-sm font-semibold transition-colors"
            >
              See on the map
              <MapPin className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous place"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-full",
            )}
          >
            <ChevronLeft aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next place"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-full",
            )}
          >
            <ChevronRight aria-hidden />
          </button>
          <span className="text-muted-foreground text-sm tabular-nums">
            {index + 1} / {stops.length}
          </span>
        </div>
      </div>

      <div
        ref={frameRef}
        className="globe-frame relative isolate order-1 mx-auto aspect-square w-full max-w-[34rem] lg:order-2"
      >
        {/* The paper disc stands in until the globe is drawn, and stays if
            the device can't do WebGL. */}
        <div
          aria-hidden
          className={cn(
            "globe-placeholder absolute inset-[6%] rounded-full transition-opacity duration-700",
            ready && !failed && "opacity-0",
          )}
        />
        <div
          ref={canvasHostRef}
          className={cn(
            "relative size-full transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0",
          )}
        />
        {hovered && hover && (
          <div
            className="globe-tip pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap"
            style={{ left: hover.x, top: hover.y }}
          >
            <span className="font-semibold">{hovered.city}</span>
            <span className="text-muted-foreground">
              {" "}
              · {countsText(hovered)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
