"use client";

import {
  createResearchTrafficLayer,
  researchTrafficLayerId,
} from "@/lib/map-traffic-3d";
import { LocateFixed, Navigation } from "lucide-react";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const AKASH_LOCATION: [number, number] = [77.900244, 29.862397];
const DARK_STYLE =
  "https://api.maptiler.com/maps/streets-v2-dark/style.json?key=IrVvN2pzTqfoeBk0mJ6F";
const LIGHT_STYLE =
  "https://api.maptiler.com/maps/outdoor-v2/style.json?key=IrVvN2pzTqfoeBk0mJ6F";

function createMarkerElement(kind: "akash" | "visitor") {
  const element = document.createElement("div");
  element.className =
    kind === "akash"
      ? "group/marker relative z-50 flex size-7 items-center justify-center"
      : "group/visitor relative z-40 flex size-7 items-center justify-center";
  element.innerHTML =
    kind === "akash"
      ? `<span class="size-3 rounded-full border-2 border-white bg-indigo-600 shadow-xl transition-transform group-hover/marker:scale-125 dark:border-zinc-800"></span>
         <span class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-zinc-900/95 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-xl transition group-hover/marker:translate-y-0 group-hover/marker:opacity-100 dark:bg-white/95 dark:text-zinc-900">Akash</span>`
      : `<span class="absolute inset-0 animate-ping rounded-full bg-sky-500/20"></span>
         <span class="size-3 rounded-full border-2 border-white bg-sky-500 shadow-xl dark:border-zinc-800"></span>
         <span class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-zinc-900/95 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-xl transition group-hover/visitor:translate-y-0 group-hover/visitor:opacity-100 dark:bg-white/95 dark:text-zinc-900">You</span>`;
  return element;
}

function distanceBetween(first: [number, number], second: [number, number]) {
  const radius = 6371;
  const latitude = ((second[1] - first[1]) * Math.PI) / 180;
  const longitude = ((second[0] - first[0]) * Math.PI) / 180;
  const a =
    Math.sin(latitude / 2) ** 2 +
    Math.cos((first[1] * Math.PI) / 180) *
      Math.cos((second[1] * Math.PI) / 180) *
      Math.sin(longitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildArc(first: [number, number], second: [number, number]) {
  const points: [number, number][] = [];
  const lift = Math.hypot(second[0] - first[0], second[1] - first[1]) * 0.22;

  for (let index = 0; index <= 120; index++) {
    const progress = index / 120;
    points.push([
      first[0] + (second[0] - first[0]) * progress,
      first[1] +
        (second[1] - first[1]) * progress +
        Math.sin(Math.PI * progress) * lift,
    ]);
  }
  return points;
}

export default function LocationMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const meMarkerRef = useRef<Marker | null>(null);
  const visitorMarkerRef = useRef<Marker | null>(null);
  const routeAnimationRef = useRef<number | null>(null);
  const [time, setTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [visitorLocation, setVisitorLocation] = useState<
    [number, number] | null
  >(null);
  const [distance, setDistance] = useState("");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setIsClient(true);
    const updateTime = () => {
      setTime(
        `${new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })} IST`,
      );
    };
    updateTime();
    const interval = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setVisitorLocation([
          position.coords.longitude,
          position.coords.latitude,
        ]),
      () => {
        // The map remains useful without location permission.
      },
      { timeout: 5_000, maximumAge: 300_000 },
    );
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current || mapRef.current) return;
    let cancelled = false;

    const initialise = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !mapContainer.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE,
        center: [78.5, 22.8],
        zoom: 3.25,
        minZoom: 2.5,
        maxZoom: 6.5,
        pitch: 0,
        bearing: 0,
        dragPan: true,
        dragRotate: false,
        scrollZoom: true,
        boxZoom: false,
        doubleClickZoom: true,
        keyboard: false,
        touchZoomRotate: true,
        touchPitch: false,
        attributionControl: false,
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;

      const addTraffic = () => {
        if (map.isStyleLoaded() && !map.getLayer(researchTrafficLayerId)) {
          map.addLayer(createResearchTrafficLayer());
        }
      };

      map.on("load", () => {
        addTraffic();
        setMapLoaded(true);
      });
      map.on("style.load", addTraffic);
    };

    void initialise();
    return () => {
      cancelled = true;
      if (routeAnimationRef.current) {
        cancelAnimationFrame(routeAnimationRef.current);
      }
      visitorMarkerRef.current?.remove();
      meMarkerRef.current?.remove();
      mapRef.current?.remove();
      visitorMarkerRef.current = null;
      meMarkerRef.current = null;
      mapRef.current = null;
    };
    // The theme is applied by the style effect after initialisation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.setStyle(resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE);
  }, [resolvedTheme, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    let cancelled = false;

    const installMarkersAndRoute = async () => {
      if (cancelled || !map.isStyleLoaded()) return;
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      if (!meMarkerRef.current) {
        meMarkerRef.current = new maplibregl.Marker({
          element: createMarkerElement("akash"),
          anchor: "center",
        })
          .setLngLat(AKASH_LOCATION)
          .addTo(map);
      }

      if (!visitorLocation) return;

      if (!visitorMarkerRef.current) {
        visitorMarkerRef.current = new maplibregl.Marker({
          element: createMarkerElement("visitor"),
          anchor: "center",
        })
          .setLngLat(visitorLocation)
          .addTo(map);
      } else {
        visitorMarkerRef.current.setLngLat(visitorLocation).addTo(map);
      }

      const routeData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: buildArc(AKASH_LOCATION, visitorLocation),
        },
      };

      if (map.getSource("visitor-route")) {
        (map.getSource("visitor-route") as GeoJSONSource).setData(routeData);
      } else {
        map.addSource("visitor-route", {
          type: "geojson",
          data: routeData,
        });
        map.addLayer({
          id: "visitor-route",
          type: "line",
          source: "visitor-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#64748b",
            "line-width": 2.2,
            "line-dasharray": [1, 2],
            "line-opacity": 0.74,
          },
        });
      }
    };

    void installMarkersAndRoute();
    map.on("style.load", installMarkersAndRoute);

    return () => {
      cancelled = true;
      map.off("style.load", installMarkersAndRoute);
    };
  }, [mapLoaded, visitorLocation]);

  const zoomToMe = () => {
    mapRef.current?.flyTo({
      center: AKASH_LOCATION,
      duration: 1_600,
      essential: true,
    });
  };

  const zoomToYou = () => {
    if (!visitorLocation) return;
    mapRef.current?.flyTo({
      center: visitorLocation,
      duration: 1_600,
      essential: true,
    });
  };

  useEffect(() => {
    if (!visitorLocation) {
      setDistance("");
      return;
    }
    const kilometres = distanceBetween(AKASH_LOCATION, visitorLocation);
    setDistance(
      kilometres < 1
        ? `${Math.round(kilometres * 1_000)} m`
        : `${kilometres.toFixed(1)} km`,
    );
  }, [visitorLocation]);

  if (!isClient) {
    return (
      <div className="bg-muted/50 h-48 animate-pulse overflow-hidden rounded-t-3xl" />
    );
  }

  return (
    <div className="group relative h-48 overflow-hidden rounded-t-3xl">
      <div className="absolute inset-0">
        <div ref={mapContainer} className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(transparent,#9d9da200_60%,#fafafa)] dark:bg-[linear-gradient(transparent,#18181b73_60%,#0a0a0a)]" />

      <div
        data-hidden={!mapLoaded}
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-100 transition-opacity duration-700 data-[hidden=true]:opacity-0"
      >
        <Image
          src="/cloud.webp"
          width={390}
          height={347}
          alt=""
          priority
          draggable={false}
          className="animate-cloud absolute -top-14 -left-12 size-72 opacity-10 blur-[1px] invert dark:opacity-16 dark:invert-0"
        />
      </div>

      <div className="absolute top-3 left-3 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={zoomToMe}
          title="Center on Akash"
          className="bg-background/68 text-foreground hover:bg-background/88 flex size-8 items-center justify-center rounded-lg border border-white/20 shadow-lg backdrop-blur-md transition hover:scale-105 active:scale-95"
        >
          <LocateFixed className="size-4 text-indigo-500" />
        </button>

        {distance && visitorLocation && (
          <div className="flex flex-col items-center py-1">
            <div className="h-3 w-px bg-slate-500/25" />
            <span className="bg-background/78 text-muted-foreground rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold whitespace-nowrap shadow-sm backdrop-blur-md">
              {distance}
            </span>
            <div className="h-3 w-px bg-sky-500/20" />
          </div>
        )}

        {visitorLocation && (
          <button
            type="button"
            onClick={zoomToYou}
            title="Center on you"
            className="bg-background/68 text-foreground hover:bg-background/88 flex size-8 items-center justify-center rounded-lg border border-white/20 shadow-lg backdrop-blur-md transition hover:scale-105 active:scale-95"
          >
            <Navigation className="size-4 text-sky-500" />
          </button>
        )}
      </div>

      <div className="bg-background/78 text-muted-foreground absolute top-3 right-3 rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-xs tabular-nums shadow-sm backdrop-blur-md">
        {time || "00:00 AM IST"}
      </div>

      <div className="bg-background/78 text-muted-foreground/80 absolute right-2 bottom-2 rounded-md border border-white/5 px-2 py-1 font-mono text-[10px] tabular-nums shadow-sm backdrop-blur-md">
        {AKASH_LOCATION[1].toFixed(6)}°N, {AKASH_LOCATION[0].toFixed(6)}°E
      </div>
    </div>
  );
}
