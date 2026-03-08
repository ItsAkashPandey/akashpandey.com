"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function LocationMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [time, setTime] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { resolvedTheme } = useTheme();

  // IIT Roorkee coordinates
  const latitude = 29.8724;
  const longitude = 77.9003;

  // MapTiler geospatial-themed styles
  // Dark mode: Streets Dark - clean dark map style
  // Light mode: Outdoor - shows terrain, contours, vegetation, trails
  const darkStyle = "https://api.maptiler.com/maps/streets-v2-dark/style.json?key=IrVvN2pzTqfoeBk0mJ6F";
  const lightStyle = "https://api.maptiler.com/maps/outdoor-v2/style.json?key=IrVvN2pzTqfoeBk0mJ6F";

  // Update time
  useEffect(() => {
    setIsClient(true);
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
      setTime(`${formattedTime} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const newStyle = resolvedTheme === 'dark' ? darkStyle : lightStyle;
    map.current.setStyle(newStyle);
  }, [resolvedTheme, mapLoaded]);

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        const initialStyle = resolvedTheme === 'dark' ? darkStyle : lightStyle;

        map.current = new maplibregl.Map({
          container: mapContainer.current as HTMLElement,
          style: initialStyle,
          center: [longitude, latitude],
          zoom: 4,
          pitch: 0,
          bearing: 0,
          attributionControl: false,
        });

        map.current.on("load", () => {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 9,
            duration: 2500,
            easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
          });

          const markerEl = document.createElement("span");
          markerEl.className = "relative flex size-2.5";
          markerEl.setAttribute("aria-label", "Map marker");

          const pingEl = document.createElement("span");
          pingEl.className = "absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500 opacity-75";

          const dotEl = document.createElement("span");
          dotEl.className = "relative inline-flex size-2.5 rounded-full bg-sky-500";

          markerEl.appendChild(pingEl);
          markerEl.appendChild(dotEl);

          new maplibregl.Marker({ element: markerEl })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

          map.current.once("idle", () => {
            setMapLoaded(true);
          });
        });
      } catch (error) {
        console.error("Failed to load map:", error);
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="group relative h-48 overflow-hidden rounded-t-3xl bg-muted/50 animate-pulse"></div>
    );
  }

  return (
    <div className="group relative h-48 overflow-hidden rounded-t-3xl">
      {/* Map container */}
      <div className="absolute size-full" ref={mapContainer}></div>

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(transparent,#9d9da200_60%,#fafafa)] dark:bg-[linear-gradient(transparent,#18181b73_60%,#0a0a0a)]"></div>

      {/* Cloud and plane animations - hidden on hover */}
      <div
        data-hidden={!mapLoaded}
        className="transition-opacity duration-500 group-hover:pointer-events-none group-hover:opacity-0 data-[hidden=true]:opacity-0"
      >
        {/* Cloud */}
        <Image
          src="/cloud.webp"
          width={390}
          height={347}
          alt="cloud"
          draggable={false}
          className="absolute top-0 size-80 animate-cloud blur-xs opacity-30 dark:opacity-40 invert dark:invert-0"
        />

        {/* Plane - simple CSS animation like duyle.dev */}
        <img
          src="/plane.webp"
          width={24}
          height={24}
          alt="plane"
          draggable={false}
          className="-right-20 -bottom-20 absolute animate-plane [animation-delay:2.5s] invert dark:invert-0"
        />

        {/* Plane Shadow - separate element with offset animation */}
        <img
          src="/plane-shadow.webp"
          width={24}
          height={24}
          alt="plane-shadow"
          draggable={false}
          className="-right-20 -bottom-20 absolute animate-plane-shadow [animation-delay:2.5s] opacity-40 dark:opacity-60 dark:invert"
        />
      </div>

      {/* Time display */}
      <div className="absolute top-0 right-0 p-3">
        <div className="rounded bg-background/80 px-2 py-1.5 font-mono text-muted-foreground text-sm tabular-nums">
          {time || "00:00 AM IST"}
        </div>
      </div>

      {/* Coordinates */}
      <div className="absolute bottom-0 right-0 p-2">
        <div className="rounded bg-background/80 px-2 py-1 font-mono text-muted-foreground text-xs tabular-nums">
          {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
        </div>
      </div>
    </div>
  );
}
