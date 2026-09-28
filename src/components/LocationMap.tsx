"use client";

import MapControls from "@/components/map/MapControls";
import {
  boundsForCoordinates,
  distanceKm,
  formatDistance,
  greatCircleMidpoint,
} from "@/lib/map/map-geometry";
import { focusedMapPoints } from "@/lib/map/map-focus";
import {
  ensureResearchLayers,
  updateVisitorConnection,
} from "@/lib/map/map-layers";
import {
  createClusterMarker,
  createLocationMarkerElement,
  createPointMarker,
} from "@/lib/map/map-markers";
import { loadMapLibre } from "@/lib/map/load-maplibre";
import { groupPopupHtml, pointPopupHtml } from "@/lib/map/map-popups";
import {
  applyMapTheme,
  createMapStyle,
  MAP_MAX_ZOOM,
  setImageryVisible,
  type MapTheme,
} from "@/lib/map/map-style";
import type { LngLat, MapData, MapPoint } from "@/lib/map/map-types";
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  Map as MapLibreMap,
  Marker,
  Popup,
} from "maplibre-gl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SOURCE = "places";
const HOME_ID = "home";
/** Past this zoom nothing is clustered, so every pin can be reached. */
const CLUSTER_MAX_ZOOM = 16;
const CLUSTER_RADIUS = 44;
/** The opening view: home plus everything within this distance of it. */
const HOME_REGION_RADIUS_KM = 600;
const LOAD_TIMEOUT_MS = 12_000;
/** How close a ?place=/?city= deep link zooms in on what it finds. */
const FOCUS_ZOOM = 13;
const FOCUS_PADDING = { top: 56, right: 60, bottom: 56, left: 60 };

type MapLibreModule = Awaited<ReturnType<typeof loadMapLibre>>;

type ClusterProperties = {
  cluster: true;
  cluster_id: number;
  activity: number;
  education: number;
  experience: number;
  home: number;
};
type PointProperties = { cluster?: false; id: string };

function toFeatureCollection(
  data: MapData,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: [
      ...data.points.map((point) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: point.coordinates },
        properties: {
          id: point.id,
          category: point.category,
          count: point.items.length,
        },
      })),
      {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: data.home.coordinates },
        properties: { id: HOME_ID, category: "home", count: 0 },
      },
    ],
  };
}

/** Sums what a cluster holds, per category, for its marker and label. */
function countIn(category: string, value: unknown = ["get", "count"]) {
  return ["+", ["case", ["==", ["get", "category"], category], value, 0]];
}

function regionBounds(data: MapData): LngLatBoundsLike {
  const home = data.home.coordinates;
  const nearby = data.points
    .map((point) => point.coordinates)
    .filter((coordinates) => distanceKm(home, coordinates) <= HOME_REGION_RADIUS_KM);
  const all = [home, ...nearby];
  return [
    [Math.min(...all.map((c) => c[0])), Math.min(...all.map((c) => c[1]))],
    [Math.max(...all.map((c) => c[0])), Math.max(...all.map((c) => c[1]))],
  ];
}

function fitLocations(map: MapLibreMap, home: LngLat, visitor: LngLat) {
  let visitorLongitude = visitor[0];
  while (visitorLongitude - home[0] > 180) visitorLongitude -= 360;
  while (visitorLongitude - home[0] < -180) visitorLongitude += 360;

  map.fitBounds(
    [
      [Math.min(home[0], visitorLongitude), Math.min(home[1], visitor[1])],
      [Math.max(home[0], visitorLongitude), Math.max(home[1], visitor[1])],
    ],
    {
      padding: { top: 56, right: 60, bottom: 56, left: 60 },
      maxZoom: 12,
      duration: 950,
      essential: true,
    },
  );
}

/**
 * MapLibre puts a popup above its pin when there is room and below it
 * otherwise, even when there is no room there either (a pin in the middle of
 * the short phone map), so a long list ran off the map and was cut off. Pan
 * just far enough to show all of it.
 */
function panPopupIntoView(map: MapLibreMap, popup: Popup) {
  const element = popup.getElement();
  if (!element || !popup.isOpen()) return;
  const frame = map.getContainer().getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const margin = 12;
  const below = box.bottom - (frame.bottom - margin);
  const above = frame.top + margin - box.top;
  const dy = below > 0 ? below : above > 0 ? -above : 0;
  if (Math.abs(dy) >= 1) map.panBy([0, dy], { duration: 450 });
}

type MapState = "loading" | "ready" | "failed";

export default function LocationMap({ data }: { data: MapData }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const visitorMarkerRef = useRef<Marker | null>(null);
  const visitorLocationRef = useRef<LngLat | null>(null);

  const [attempt, setAttempt] = useState(0);
  const [mapState, setMapState] = useState<MapState>("loading");
  const [imagery, setImagery] = useState(true);
  const [visitorLocation, setVisitorLocation] = useState<LngLat | null>(null);
  const [distanceLabelPosition, setDistanceLabelPosition] = useState({ x: 0, y: 0 });
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const home = data.home.coordinates;
  const mapLoaded = mapState === "ready";
  const pointsById = useMemo(
    () => new Map<string, MapPoint>(data.points.map((point) => [point.id, point])),
    [data.points],
  );
  const bounds = useMemo(() => regionBounds(data), [data]);
  const visitorDistance = visitorLocation ? distanceKm(home, visitorLocation) : null;

  useEffect(() => {
    visitorLocationRef.current = visitorLocation;
  }, [visitorLocation]);

  // Shared by marker clicks and the ?place=/?city= deep link below, so a
  // popup always opens and focuses the same way no matter what triggered it.
  const openPopup = useCallback(
    (maplibregl: MapLibreModule, coordinates: LngLat, html: string) => {
      const map = mapRef.current;
      if (!map) return;
      popupRef.current?.remove();
      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        className: "map-popup",
        maxWidth: "300px",
        // Focus is moved below, without scrolling. MapLibre's own focus
        // scrolls the page to the popup, and a deep-linked one that is still
        // off the map (Vienna, before the fly-to) sent the page to the top.
        focusAfterOpen: false,
      })
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
      popupRef.current = popup;
      // Keyboard users land on the first entry instead of the page behind.
      popup
        .getElement()
        ?.querySelector<HTMLElement>("a")
        ?.focus({ preventScroll: true });
      // A deep link is still flying there, so wait for the camera to stop.
      const reveal = () => panPopupIntoView(map, popup);
      if (map.isMoving()) map.once("moveend", reveal);
      else reveal();
    },
    [],
  );

  // Create the map. Re-runs on "Try again" (attempt) after a failed load.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let loaded = false;
    let map: MapLibreMap | null = null;
    const markers = new Map<string, Marker>();

    const timer = window.setTimeout(() => {
      if (!loaded && !cancelled) setMapState("failed");
    }, LOAD_TIMEOUT_MS);

    const initialise = async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled) return;

      const theme: MapTheme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";

      map = new maplibregl.Map({
        container,
        style: createMapStyle(theme),
        bounds,
        fitBoundsOptions: { padding: 40, maxZoom: 9 },
        minZoom: 1,
        maxZoom: MAP_MAX_ZOOM,
        dragRotate: false,
        touchPitch: false,
        // Box zoom fights the drag-to-pan people expect.
        boxZoom: false,
        // The page keeps the wheel and one-finger swipes; the map takes
        // Ctrl/Cmd + wheel and two fingers, and says so on screen.
        cooperativeGestures: true,
        attributionControl: { compact: true },
        renderWorldCopies: false,
        fadeDuration: 80,
      });
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      mapRef.current = map;
      const current = map;

      // MapLibre swallows style, source and glyph failures unless something
      // listens, which made a blank map impossible to diagnose.
      map.on("error", (event) => {
        console.error("[map]", event.error?.message ?? event);
      });

      const updateMarkers = () => {
        if (!current.getSource(SOURCE)) return;
        const seen = new Set<string>();

        for (const feature of current.querySourceFeatures(SOURCE)) {
          const properties = feature.properties as ClusterProperties | PointProperties;
          const coordinates = (feature.geometry as GeoJSON.Point).coordinates as LngLat;
          const key = properties.cluster
            ? `cluster:${properties.cluster_id}`
            : `point:${properties.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          if (markers.has(key)) continue;

          let element: HTMLElement;
          if (properties.cluster) {
            const cluster = properties;
            element = createClusterMarker(cluster);
            element.addEventListener("click", async (event) => {
              event.stopPropagation();
              const source = current.getSource(SOURCE) as GeoJSONSource;
              const zoom = await source.getClusterExpansionZoom(cluster.cluster_id);
              if (zoom <= CLUSTER_MAX_ZOOM) {
                current.easeTo({ center: coordinates, zoom: zoom + 0.2, duration: 600 });
                return;
              }
              // Points that share one spot never separate: list them instead.
              const leaves = await source.getClusterLeaves(cluster.cluster_id, 200, 0);
              const points = leaves
                .map((leaf) => pointsById.get(String(leaf.properties?.id)))
                .filter((point): point is MapPoint => Boolean(point));
              openPopup(maplibregl, coordinates, groupPopupHtml(points, cluster.home > 0));
            });
          } else if (properties.id === HOME_ID) {
            element = createLocationMarkerElement("akash");
            element.addEventListener("click", (event) => {
              event.stopPropagation();
              if (visitorLocationRef.current) {
                fitLocations(current, home, visitorLocationRef.current);
              } else {
                current.easeTo({
                  center: home,
                  zoom: Math.max(current.getZoom(), 14),
                  duration: 850,
                });
              }
            });
          } else {
            const point = pointsById.get(properties.id);
            if (!point) continue;
            element = createPointMarker(point);
            element.addEventListener("click", (event) => {
              event.stopPropagation();
              openPopup(maplibregl, point.coordinates, pointPopupHtml(point));
            });
          }

          markers.set(
            key,
            new maplibregl.Marker({ element, anchor: "center" })
              .setLngLat(coordinates)
              .addTo(current),
          );
        }

        for (const [key, marker] of markers) {
          if (!seen.has(key)) {
            marker.remove();
            markers.delete(key);
          }
        }
      };

      map.on("load", () => {
        if (cancelled) return;
        loaded = true;
        window.clearTimeout(timer);

        current.addSource(SOURCE, {
          type: "geojson",
          data: toFeatureCollection(data),
          cluster: true,
          clusterRadius: CLUSTER_RADIUS,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
          clusterProperties: {
            activity: countIn("activity"),
            education: countIn("education"),
            experience: countIn("experience"),
            home: countIn("home", 1),
          },
        });
        // Invisible: it only makes MapLibre build the clustered tiles that
        // the HTML markers are read from.
        current.addLayer({
          id: `${SOURCE}-index`,
          type: "circle",
          source: SOURCE,
          paint: { "circle-radius": 0, "circle-opacity": 0 },
        });

        current.on("render", updateMarkers);
        setMapState("ready");
      });
    };

    void initialise().catch((error) => {
      console.error("[map] initialise failed", error);
      if (!cancelled) setMapState("failed");
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      for (const marker of markers.values()) marker.remove();
      popupRef.current?.remove();
      popupRef.current = null;
      visitorMarkerRef.current?.remove();
      visitorMarkerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [attempt, bounds, data, home, openPopup, pointsById]);

  // Theme and imagery are applied from React state on every change, so the
  // buttons and the map can no longer drift apart.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const theme: MapTheme = resolvedTheme === "dark" ? "dark" : "light";
    applyMapTheme(map, theme);
    ensureResearchLayers(map, theme);
    updateVisitorConnection(map, home, visitorLocationRef.current);
  }, [mapLoaded, resolvedTheme, home]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    setImageryVisible(map, imagery);
  }, [mapLoaded, imagery]);

  // Opens the map at a specific place or city when linked to from elsewhere
  // on the site (the globe's "more on the map" links, so far). Read once
  // the map is ready, so the deep link wins over the opening view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const points = focusedMapPoints(data.points, window.location.search);
    if (!points.length) return;

    let active = true;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    void loadMapLibre().then((maplibregl) => {
      if (!active) return;

      if (points.length === 1) {
        const [point] = points;
        if (reducedMotion) {
          map.jumpTo({ center: point.coordinates, zoom: FOCUS_ZOOM });
        } else {
          map.flyTo({ center: point.coordinates, zoom: FOCUS_ZOOM });
        }
        openPopup(maplibregl, point.coordinates, pointPopupHtml(point));
        return;
      }

      const focusBounds = boundsForCoordinates(points.map((point) => point.coordinates));
      map.fitBounds(focusBounds, {
        padding: FOCUS_PADDING,
        maxZoom: FOCUS_ZOOM,
        duration: reducedMotion ? 0 : 900,
      });
      const [[minLng, minLat], [maxLng, maxLat]] = focusBounds;
      const center: LngLat = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
      // These points only ever come from `data.points` — Akash's own pin
      // isn't one of them, so a deep-linked group is never "home".
      openPopup(maplibregl, center, groupPopupHtml(points, false));
    });

    return () => {
      active = false;
    };
  }, [mapLoaded, data.points, openPopup]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !visitorLocation) return;
    let active = true;

    void loadMapLibre().then((maplibregl) => {
      if (!active) return;
      visitorMarkerRef.current ??= new maplibregl.Marker({
        element: createLocationMarkerElement("visitor"),
        anchor: "center",
      });
      visitorMarkerRef.current.setLngLat(visitorLocation).addTo(map);
    });

    return () => {
      active = false;
    };
  }, [mapLoaded, visitorLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    ensureResearchLayers(map, resolvedTheme === "dark" ? "dark" : "light");
    updateVisitorConnection(map, home, visitorLocation);

    const updateLabelPosition = () => {
      if (!visitorLocation) return;
      const point = map.project(greatCircleMidpoint(home, visitorLocation));
      setDistanceLabelPosition({ x: point.x, y: point.y });
    };
    updateLabelPosition();
    map.on("move", updateLabelPosition);
    return () => {
      map.off("move", updateLabelPosition);
    };
  }, [mapLoaded, visitorLocation, resolvedTheme, home]);

  useEffect(() => {
    if (!locationMessage) return;
    const timer = window.setTimeout(() => setLocationMessage(""), 3_200);
    return () => window.clearTimeout(timer);
  }, [locationMessage]);

  const locateVisitor = () => {
    const map = mapRef.current;
    if (!map) return;
    if (visitorLocation) {
      fitLocations(map, home, visitorLocation);
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationMessage("Location is not available in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: LngLat = [position.coords.longitude, position.coords.latitude];
        setVisitorLocation(next);
        setLocating(false);
        setLocationMessage("");
        fitLocations(map, home, next);
      },
      () => {
        setLocating(false);
        setLocationMessage("Location permission was not granted.");
      },
      { enableHighAccuracy: false, timeout: 7_000, maximumAge: 300_000 },
    );
  };

  const resetView = useCallback(() => {
    popupRef.current?.remove();
    mapRef.current?.fitBounds(bounds, { padding: 40, maxZoom: 9, duration: 700 });
  }, [bounds]);

  // Links inside popups are plain HTML; route the internal ones through the
  // Next router, so the page (and an open Kasi chat) is not reloaded.
  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      "a[data-internal]",
    );
    if (
      !anchor ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    router.push(anchor.getAttribute("href") ?? "/");
  };

  return (
    <>
      <a
        href="#map-end"
        className="bg-background text-foreground sr-only z-50 rounded-md px-3 py-2 text-sm font-semibold focus:not-sr-only focus:absolute focus:m-3"
      >
        Skip the map
      </a>
      {/* The click handler only reroutes popup links; the map and its controls
          are keyboard operable themselves. A size container, so a popup can
          be capped at the map's height (globals.css). */}
      <div
        onClick={onClick}
        className="group bg-muted [container-type:size] relative isolate h-80 overflow-hidden rounded-md sm:h-[28rem]"
      >
        <div
          ref={containerRef}
          className="absolute inset-0 size-full"
          aria-label="Map of places Akash has studied, worked and visited"
          role="region"
        />

        <MapControls
          disabled={!mapLoaded}
          imagery={imagery}
          locateDisabled={
            typeof navigator !== "undefined" && !("geolocation" in navigator)
          }
          locating={locating}
          onLocate={locateVisitor}
          onToggleImagery={() => setImagery((value) => !value)}
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onReset={resetView}
        />

        {visitorDistance !== null && (
          <>
            <div
              className="bg-background/92 border-border/65 pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-sm border px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur-md"
              style={{ left: distanceLabelPosition.x, top: distanceLabelPosition.y }}
            >
              {formatDistance(visitorDistance)}
            </div>
            <div className="bg-background/90 border-border/65 pointer-events-none absolute top-3 right-3 z-30 flex flex-col items-center rounded-md border px-2.5 py-2 text-xs shadow-sm backdrop-blur-md">
              <span className="text-ink font-semibold">You</span>
              <span className="border-warm/60 my-1 h-8 border-l border-dashed" />
              <span className="font-semibold tabular-nums">
                {formatDistance(visitorDistance)}
              </span>
              <span className="text-warm mt-1 font-semibold">
                Akash
              </span>
            </div>
          </>
        )}

        {locationMessage && (
          <div
            role="status"
            className="bg-background/94 border-border/70 text-foreground absolute top-3 left-16 z-40 rounded-md border px-3 py-1.5 text-xs shadow-md"
          >
            {locationMessage}
          </div>
        )}

        {mapState === "failed" && (
          <div
            role="status"
            className="bg-background/92 text-muted-foreground absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm backdrop-blur-sm"
          >
            The map could not load. The tile servers may be slow right now.
            <button
              type="button"
              onClick={() => {
                setMapState("loading");
                setAttempt((value) => value + 1);
              }}
              className="border-border bg-card hover:bg-accent text-foreground rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
      <span id="map-end" tabIndex={-1} className="sr-only">
        End of map
      </span>
    </>
  );
}
