"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Navigation, LocateFixed } from "lucide-react";

export default function LocationMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [time, setTime] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { resolvedTheme } = useTheme();

  // IIT Roorkee coordinates
  const latitude = 29.862397;
  const longitude = 77.900244;

  const [visitorLocation, setVisitorLocation] = useState<[number, number] | null>(null);

  // MapTiler geospatial-themed styles
  // Dark mode: Streets Dark - clean dark map style
  // Light mode: Outdoor - shows terrain, contours, vegetation, trails
  const darkStyle = "https://api.maptiler.com/maps/streets-v2-dark/style.json?key=IrVvN2pzTqfoeBk0mJ6F";
  const lightStyle = "https://api.maptiler.com/maps/outdoor-v2/style.json?key=IrVvN2pzTqfoeBk0mJ6F";

  // Get visitor location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVisitorLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.warn("Geolocation access denied or failed:", error.message);
        }
      );
    }
  }, []);

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

  const animFrameRef = useRef<number | null>(null);
  const meMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [distance, setDistance] = useState<string>("");

  // Navigation handlers
  const zoomToMe = () => {
    if (!map.current) return;
    map.current.flyTo({
      center: [longitude, latitude],
      zoom: 12,
      duration: 2000,
      essential: true
    });
  };

  const zoomToYou = () => {
    if (!map.current || !visitorLocation) return;
    map.current.flyTo({
      center: visitorLocation,
      zoom: 12,
      duration: 2000,
      essential: true
    });
  };

  // 1. Initialize map once
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
          setMapLoaded(true);
        });
      } catch (error) {
        console.error("Failed to load map:", error);
      }
    };

    initMap();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isClient, resolvedTheme]); // resolvedTheme is needed here for the initial style

  // 2. Handle Markers and Layers dynamically
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const addMarkersAndRoute = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      // Me Marker (Always on top)
      if (!meMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "group/marker relative flex size-6 items-center justify-center z-50";
        el.innerHTML = `
          <div class="size-3 rounded-full bg-indigo-600 border-2 border-white dark:border-zinc-800 shadow-xl transition-transform group-hover/marker:scale-125 duration-75"></div>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 text-[10px] font-bold rounded-md opacity-0 group-hover/marker:opacity-100 transition-all duration-75 shadow-xl pointer-events-none translate-y-1 group-hover/marker:translate-y-0 whitespace-nowrap">
            Akash (Me)
          </div>
        `;

        import("maplibre-gl").then((m) => {
          if (!map.current) return;
          meMarkerRef.current = new m.default.Marker({ element: el, anchor: 'center' })
            .setLngLat([longitude, latitude])
            .addTo(map.current);
          el.parentElement!.style.zIndex = "100";
        });
      } else {
        meMarkerRef.current.addTo(map.current);
      }

      // Visitor Marker
      if (visitorLocation) {
        if (!userMarkerRef.current) {
          const el = document.createElement("div");
          el.className = "group/user relative flex size-6 items-center justify-center z-40";
          el.innerHTML = `
            <div class="absolute inset-0 rounded-full bg-sky-500/20 animate-ping"></div>
            <div class="size-3 rounded-full bg-sky-500 border-2 border-white dark:border-zinc-800 shadow-xl"></div>
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 text-[10px] font-bold rounded-md opacity-0 group-hover/user:opacity-100 transition-all duration-75 shadow-xl pointer-events-none translate-y-1 group-hover/user:translate-y-0 whitespace-nowrap">
              You
            </div>
          `;

          import("maplibre-gl").then((m) => {
            if (!map.current) return;
            userMarkerRef.current = new m.default.Marker({ element: el, anchor: 'center' })
              .setLngLat(visitorLocation)
              .addTo(map.current);
            el.parentElement!.style.zIndex = "50";
          });
        } else {
          userMarkerRef.current.addTo(map.current);
        }

        // Distance Calculation
        const R = 6371;
        const dLat = (visitorLocation[1] - latitude) * Math.PI / 180;
        const dLon = (visitorLocation[0] - longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(visitorLocation[1] * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        const distanceStr = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
        setDistance(distanceStr);

        // Red Flight Line
        const steps = 150;
        const arc: [number, number][] = [];
        const [lon1, lat1] = [longitude, latitude];
        const [lon2, lat2] = visitorLocation;
        const lift = Math.sqrt(Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2)) * 0.25;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const lon = lon1 + (lon2 - lon1) * t;
          const lat = lat1 + (lat2 - lat1) * t + Math.sin(Math.PI * t) * lift;
          arc.push([lon, lat]);
        }

        const routeData: any = {
          'type': 'Feature',
          'geometry': { 'type': 'LineString', 'coordinates': arc }
        };

        if (map.current.getSource('route')) {
          (map.current.getSource('route') as any).setData(routeData);
        } else {
          map.current.addSource('route', { 'type': 'geojson', 'data': routeData });
          map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': { 'line-join': 'round', 'line-cap': 'round' },
            'paint': {
              'line-color': '#ef4444',
              'line-width': 4,
              'line-dasharray': [1, 2],
              'line-opacity': 0.9
            }
          });

          let dashOffset = 0;
          const animate = () => {
            if (!map.current || !map.current.getLayer('route')) return;
            dashOffset = (dashOffset - 0.08) % 3;
            try { map.current.setPaintProperty('route', 'line-dash-offset', dashOffset); } catch (e) { }
            animFrameRef.current = requestAnimationFrame(animate);
          };
          animFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };

    addMarkersAndRoute();
    map.current.on('style.load', addMarkersAndRoute);

    if (visitorLocation && map.current.getZoom() < 5) {
      import("maplibre-gl").then((m) => {
        const bounds = new m.default.LngLatBounds()
          .extend([longitude, latitude])
          .extend(visitorLocation);
        map.current.fitBounds(bounds, { padding: 60, maxZoom: 9, duration: 2500 });
      });
    }

    return () => {
      if (map.current) map.current.off('style.load', addMarkersAndRoute);
    };

  }, [mapLoaded, visitorLocation, resolvedTheme]);

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
        className="transition-opacity duration-150 group-hover:pointer-events-none group-hover:opacity-0 data-[hidden=true]:opacity-0"
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

      {/* Navigation Controls */}
      <div className="absolute left-3 top-3 flex flex-col gap-1 items-center">
        <button
          onClick={zoomToMe}
          title="Zoom to Akash"
          className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-background/60 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background/80 hover:scale-105 active:scale-95"
        >
          <LocateFixed className="size-4 text-indigo-500" />
        </button>

        {distance && visitorLocation && (
          <div className="flex flex-col items-center py-1">
            <div className="h-4 w-px bg-indigo-500/20"></div>
            <div className="bg-background/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{distance}</span>
            </div>
            <div className="h-4 w-px bg-sky-500/20"></div>
          </div>
        )}

        {visitorLocation && (
          <button
            onClick={zoomToYou}
            title="Zoom to You"
            className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-background/60 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background/80 hover:scale-105 active:scale-95"
          >
            <Navigation className="size-4 text-sky-500" />
          </button>
        )}
      </div>

      {/* Time display */}
      <div className="absolute top-0 right-0 p-3 flex flex-col items-end gap-1">
        <div className="rounded bg-background/80 backdrop-blur-sm px-2 py-1.5 font-mono text-muted-foreground text-sm tabular-nums shadow-sm border border-white/10">
          {time || "00:00 AM IST"}
        </div>
      </div>

      {/* Coordinates */}
      <div className="absolute bottom-0 right-0 p-2">
        <div className="rounded bg-background/80 backdrop-blur-sm px-2 py-1 font-mono text-muted-foreground text-[10px] tabular-nums shadow-sm border border-white/5 opacity-70">
          {latitude.toFixed(6)}°N, {longitude.toFixed(6)}°E
        </div>
      </div>
    </div>
  );
}
