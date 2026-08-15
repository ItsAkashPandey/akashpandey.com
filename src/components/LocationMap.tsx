"use client";

import MapControls from "@/components/map/MapControls";
import {
  distanceKm,
  formatDistance,
  greatCircleMidpoint,
} from "@/lib/map/map-geometry";
import {
  ensureResearchLayers,
  updateVisitorConnection,
} from "@/lib/map/map-layers";
import {
  createActivityMarkerElement,
  createLocationMarkerElement,
} from "@/lib/map/map-markers";
import { buildActivityPoints } from "@/lib/map/activity-points";
import {
  applyMapTheme,
  createMapStyle,
  type MapTheme,
} from "@/lib/map/map-style";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const AKASH_LOCATION: [longitude: number, latitude: number] = [
  77.900244, 29.862397,
];

/** Anything past this radius (Vienna, chiefly) is still pinned on the map,
 * it just doesn't drag the opening view out to a mostly-ocean world shot. */
const HOME_CLUSTER_RADIUS_KM = 2000;

const ACTIVITY_POINTS = buildActivityPoints();

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Popup content is built as an HTML string (MapLibre's `setHTML`), so
 * activity names and hrefs — free text from `activities.json` — go through
 * this before they touch the template. */
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function fitLocations(
  map: MapLibreMap,
  visitor: [longitude: number, latitude: number],
) {
  let visitorLongitude = visitor[0];
  while (visitorLongitude - AKASH_LOCATION[0] > 180) visitorLongitude -= 360;
  while (visitorLongitude - AKASH_LOCATION[0] < -180) visitorLongitude += 360;

  map.fitBounds(
    [
      [
        Math.min(AKASH_LOCATION[0], visitorLongitude),
        Math.min(AKASH_LOCATION[1], visitor[1]),
      ],
      [
        Math.max(AKASH_LOCATION[0], visitorLongitude),
        Math.max(AKASH_LOCATION[1], visitor[1]),
      ],
    ],
    {
      padding: { top: 56, right: 60, bottom: 56, left: 60 },
      // A 8.5 ceiling collapsed two nearby points into one dot. Only cap far
      // enough back that a same-city pair still reads as two markers.
      maxZoom: 12,
      duration: 950,
      essential: true,
    },
  );
}

/** Opens on the spread of activity pins near home instead of a street-level
 * zoom on one address, so the map reads as "everywhere I've worked" first. */
function fitHomeCluster(map: MapLibreMap) {
  const nearby = ACTIVITY_POINTS.filter(
    (point) => distanceKm(AKASH_LOCATION, point.coordinates) <= HOME_CLUSTER_RADIUS_KM,
  );
  if (nearby.length === 0) return;

  let minLng = AKASH_LOCATION[0];
  let maxLng = AKASH_LOCATION[0];
  let minLat = AKASH_LOCATION[1];
  let maxLat = AKASH_LOCATION[1];
  for (const point of nearby) {
    minLng = Math.min(minLng, point.coordinates[0]);
    maxLng = Math.max(maxLng, point.coordinates[0]);
    minLat = Math.min(minLat, point.coordinates[1]);
    maxLat = Math.max(maxLat, point.coordinates[1]);
  }

  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    {
      padding: { top: 36, right: 36, bottom: 36, left: 36 },
      maxZoom: 7,
      duration: 0,
    },
  );
}

export default function LocationMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const akashMarkerRef = useRef<Marker | null>(null);
  const visitorMarkerRef = useRef<Marker | null>(null);
  const activityMarkersRef = useRef<Marker[]>([]);
  const visitorLocationRef = useRef<[number, number] | null>(null);
  const mapThemeRef = useRef<MapTheme>("light");
  const mapReadyRef = useRef(false);

  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [visitorLocation, setVisitorLocation] = useState<
    [number, number] | null
  >(null);
  const [distanceLabelPosition, setDistanceLabelPosition] = useState({
    x: 0,
    y: 0,
  });
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const { resolvedTheme } = useTheme();

  const visitorDistance = visitorLocation
    ? distanceKm(AKASH_LOCATION, visitorLocation)
    : null;

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    visitorLocationRef.current = visitorLocation;
  }, [visitorLocation]);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return;
    let cancelled = false;
    let loadTimer = 0;

    const initialise = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !mapContainerRef.current) return;

      const theme: MapTheme = document.documentElement.classList.contains(
        "dark",
      )
        ? "dark"
        : "light";
      mapThemeRef.current = theme;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: createMapStyle(theme),
        center: AKASH_LOCATION,
        zoom: 4,
        minZoom: 1,
        maxZoom: 22,
        pitch: 0,
        bearing: 0,
        dragPan: true,
        dragRotate: false,
        scrollZoom: true,
        // Shift-drag box zoom fights the drag-to-pan people actually expect.
        boxZoom: false,
        doubleClickZoom: true,
        keyboard: true,
        touchZoomRotate: true,
        touchPitch: false,
        attributionControl: false,
        renderWorldCopies: false,
        fadeDuration: 80,
        zoomSnap: 0,
        cancelPendingTileRequestsWhileZooming: false,
        maxTileCacheZoomLevels: 8,
      });
      // Pinch-to-zoom stays; pinch-to-rotate does not — a quiet distance
      // widget has no use for a control that then needs its own reset button.
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;

      const handleLoad = () => {
        mapReadyRef.current = true;
        window.clearTimeout(loadTimer);
        applyMapTheme(map, mapThemeRef.current);
        ensureResearchLayers(map, mapThemeRef.current);
        fitHomeCluster(map);
        setMapLoaded(true);
        setMapUnavailable(false);
        document.documentElement.dataset.heroMapReady = "true";
        window.dispatchEvent(new Event("hero-map-ready"));
      };

      // MapLibre swallows style, source and glyph failures unless something
      // listens, which is what made a blank map impossible to diagnose.
      map.on("error", (event) => {
        console.error("[map]", event.error?.message ?? event);
      });
      map.on("load", handleLoad);
      loadTimer = window.setTimeout(() => {
        if (!mapReadyRef.current) setMapUnavailable(true);
      }, 8_000);
    };

    void initialise().catch((error) => {
      console.error("[map] initialise failed", error);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      mapReadyRef.current = false;
      akashMarkerRef.current?.remove();
      visitorMarkerRef.current?.remove();
      for (const marker of activityMarkersRef.current) marker.remove();
      activityMarkersRef.current = [];
      mapRef.current?.remove();
      akashMarkerRef.current = null;
      visitorMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [isClient]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const theme: MapTheme = resolvedTheme === "dark" ? "dark" : "light";
    mapThemeRef.current = theme;
    applyMapTheme(map, theme);
    ensureResearchLayers(map, theme);
  }, [mapLoaded, resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || akashMarkerRef.current) return;
    let active = true;

    const addMarker = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (!active) return;
      const element = createLocationMarkerElement("akash");
      element.addEventListener("click", () => {
        if (visitorLocationRef.current) {
          fitLocations(map, visitorLocationRef.current);
        } else {
          map.easeTo({
            center: AKASH_LOCATION,
            zoom: Math.max(map.getZoom(), 14),
            duration: 850,
            essential: true,
          });
        }
      });
      akashMarkerRef.current = new maplibregl.Marker({
        element,
        anchor: "center",
      })
        .setLngLat(AKASH_LOCATION)
        .addTo(map);
    };

    void addMarker();
    return () => {
      active = false;
    };
  }, [mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || activityMarkersRef.current.length > 0) return;
    let active = true;

    const addMarkers = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (!active) return;

      activityMarkersRef.current = ACTIVITY_POINTS.map((point) => {
        const element = createActivityMarkerElement(
          point.activities.length,
          point.label,
        );
        const rows = point.activities
          .map(
            (activity) => `<li><a href="${escapeHtml(activity.href)}">
              <span class="activity-popup-text">
                <span class="activity-popup-name">${escapeHtml(activity.name)}</span>
                <span class="activity-popup-date">${escapeHtml(
                  new Date(`${activity.date}T12:00:00`).toLocaleDateString(
                    undefined,
                    { month: "short", year: "numeric" },
                  ),
                )}</span>
              </span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a></li>`,
          )
          .join("");
        const popup = new maplibregl.Popup({
          offset: 14,
          closeButton: true,
          className: "activity-popup",
        }).setHTML(
          `<div class="activity-popup-card">
            <header class="activity-popup-head">
              <span class="activity-popup-place">${escapeHtml(point.label)}</span>
              <span class="activity-popup-count">${point.activities.length} ${
                point.activities.length === 1 ? "visit" : "visits"
              }</span>
            </header>
            <ul class="activity-popup-list">${rows}</ul>
          </div>`,
        );

        return new maplibregl.Marker({ element, anchor: "center" })
          .setLngLat(point.coordinates)
          .setPopup(popup)
          .addTo(map);
      });
    };

    void addMarkers();
    return () => {
      active = false;
    };
  }, [mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !visitorLocation) return;
    let active = true;

    const addMarker = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (!active) return;
      if (!visitorMarkerRef.current) {
        visitorMarkerRef.current = new maplibregl.Marker({
          element: createLocationMarkerElement("visitor"),
          anchor: "center",
        });
      }
      visitorMarkerRef.current.setLngLat(visitorLocation).addTo(map);
    };

    void addMarker();
    return () => {
      active = false;
    };
  }, [mapLoaded, visitorLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    ensureResearchLayers(map, mapThemeRef.current);
    updateVisitorConnection(map, AKASH_LOCATION, visitorLocation);

    const updateLabelPosition = () => {
      if (!visitorLocation) return;
      const midpoint = greatCircleMidpoint(AKASH_LOCATION, visitorLocation);
      const point = map.project(midpoint);
      setDistanceLabelPosition({ x: point.x, y: point.y });
    };
    updateLabelPosition();
    map.on("move", updateLabelPosition);
    return () => {
      map.off("move", updateLabelPosition);
    };
  }, [mapLoaded, visitorLocation, resolvedTheme]);

  useEffect(() => {
    if (!locationMessage) return;
    const timer = window.setTimeout(() => setLocationMessage(""), 3_200);
    return () => window.clearTimeout(timer);
  }, [locationMessage]);

  const locateVisitor = () => {
    const map = mapRef.current;
    if (!map) return;
    if (visitorLocation) {
      fitLocations(map, visitorLocation);
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationMessage("Location is not available in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setVisitorLocation(nextLocation);
        setLocating(false);
        setLocationMessage("");
        fitLocations(map, nextLocation);
      },
      () => {
        setLocating(false);
        setLocationMessage("Location permission was not granted.");
      },
      {
        enableHighAccuracy: false,
        timeout: 7_000,
        maximumAge: 300_000,
      },
    );
  };

  if (!isClient) {
    return (
      <div className="h-72 animate-pulse overflow-hidden rounded-md bg-[#f1ede2] sm:h-[26rem] dark:bg-[#1b2429]" />
    );
  }

  return (
    <div
      ref={rootRef}
      className="group relative isolate h-72 overflow-hidden rounded-md bg-[#f1ede2] sm:h-[26rem] dark:bg-[#1b2429]"
    >
      <div
        ref={mapContainerRef}
        className="absolute inset-0 size-full"
        style={{ position: "absolute" }}
      />

      <MapControls
        disabled={!mapLoaded}
        locateDisabled={
          typeof navigator !== "undefined" && !("geolocation" in navigator)
        }
        locating={locating}
        onLocate={locateVisitor}
      />

      {visitorDistance !== null && (
        <>
          <div
            className="bg-background/92 border-border/65 pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 border px-2 py-1 text-[9px] font-medium shadow-sm backdrop-blur-md"
            style={{
              left: distanceLabelPosition.x,
              top: distanceLabelPosition.y,
            }}
          >
            {formatDistance(visitorDistance)}
          </div>
          <div className="bg-background/88 border-border/65 pointer-events-none absolute top-12 right-3 z-30 flex w-12 flex-col items-center border py-2 shadow-sm backdrop-blur-md">
            <span className="text-[8px] font-semibold text-sky-700 dark:text-sky-200">
              You
            </span>
            <span className="my-1 h-9 border-l border-dashed border-orange-700/60 dark:border-orange-200/60" />
            <span className="font-mono text-[8px] tabular-nums">
              {formatDistance(visitorDistance)}
            </span>
            <span className="mt-1 text-[8px] font-semibold text-orange-700 dark:text-orange-200">
              Akash
            </span>
          </div>
        </>
      )}

      {locationMessage && (
        <div
          role="status"
          className="bg-background/94 border-border/70 text-foreground absolute top-3 left-12 z-40 border px-2.5 py-1.5 text-[10px] shadow-md"
        >
          {locationMessage}
        </div>
      )}

      {mapUnavailable && (
        <div
          role="status"
          className="bg-background/92 text-muted-foreground absolute inset-0 z-20 flex items-center justify-center px-6 text-center text-sm backdrop-blur-sm"
        >
          The map is temporarily unavailable. It will retry automatically.
        </div>
      )}
    </div>
  );
}
