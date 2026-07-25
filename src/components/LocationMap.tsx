"use client";

import MapControls from "@/components/map/MapControls";
import SatellitePopup from "@/components/map/SatellitePopup";
import { createFallbackSatelliteFeed } from "@/data/satellite-fallback";
import {
  createLocationMarkerElement,
  createSatelliteMarkerElement,
} from "@/lib/map/map-markers";
import { applyMapTheme, MAP_STYLES } from "@/lib/map/map-style";
import {
  createTrackedSatellites,
  satelliteGroundTrack,
  satelliteSnapshot,
  type TrackedSatellite,
} from "@/lib/map/satellite-orbits";
import type {
  SatelliteFeed,
  SatelliteSnapshot,
} from "@/lib/map/satellite-types";
import { LoaderCircle, Satellite } from "lucide-react";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";

const AKASH_LOCATION: [longitude: number, latitude: number] = [
  77.900244, 29.862397,
];
const SATELLITE_SOURCE_ID = "tracked-satellite-orbit";
const SATELLITE_GLOW_LAYER_ID = "tracked-satellite-orbit-glow";
const SATELLITE_PAST_LAYER_ID = "tracked-satellite-orbit-past";
const SATELLITE_FUTURE_LAYER_ID = "tracked-satellite-orbit-future";

type SatelliteMarkerHandle = {
  marker: Marker;
  tracked: TrackedSatellite;
  setBearing: (bearing: number) => void;
  setSelected: (selected: boolean) => void;
};

function emptyTrack(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return { type: "FeatureCollection", features: [] };
}

function syncSatelliteTrack(
  map: MapLibreMap,
  tracked: TrackedSatellite | undefined,
  dark: boolean,
) {
  if (!map.isStyleLoaded()) return;
  const track = tracked
    ? satelliteGroundTrack(tracked, new Date())
    : emptyTrack();
  const source = map.getSource(SATELLITE_SOURCE_ID) as
    GeoJSONSource | undefined;

  if (source) {
    source.setData(track);
  } else {
    map.addSource(SATELLITE_SOURCE_ID, {
      type: "geojson",
      data: track,
      lineMetrics: true,
      maxzoom: 8,
    });
  }

  const color = dark ? "#72d2c8" : "#147b78";
  if (!map.getLayer(SATELLITE_GLOW_LAYER_ID)) {
    map.addLayer({
      id: SATELLITE_GLOW_LAYER_ID,
      type: "line",
      source: SATELLITE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 6,
        "line-opacity": 0.12,
        "line-blur": 2,
      },
    });
  }

  if (!map.getLayer(SATELLITE_PAST_LAYER_ID)) {
    map.addLayer({
      id: SATELLITE_PAST_LAYER_ID,
      type: "line",
      source: SATELLITE_SOURCE_ID,
      filter: ["==", ["get", "phase"], "past"],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 1.4,
        "line-opacity": 0.46,
        "line-dasharray": [1.5, 2],
      },
    });
  }

  if (!map.getLayer(SATELLITE_FUTURE_LAYER_ID)) {
    map.addLayer({
      id: SATELLITE_FUTURE_LAYER_ID,
      type: "line",
      source: SATELLITE_SOURCE_ID,
      filter: ["==", ["get", "phase"], "future"],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 2,
        "line-opacity": 0.92,
      },
    });
  }
}

function distanceBetween(first: [number, number], second: [number, number]) {
  const radius = 6_371;
  const latitude = ((second[1] - first[1]) * Math.PI) / 180;
  const longitude = ((second[0] - first[0]) * Math.PI) / 180;
  const a =
    Math.sin(latitude / 2) ** 2 +
    Math.cos((first[1] * Math.PI) / 180) *
      Math.cos((second[1] * Math.PI) / 180) *
      Math.sin(longitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const akashMarkerRef = useRef<Marker | null>(null);
  const visitorMarkerRef = useRef<Marker | null>(null);
  const satelliteMarkersRef = useRef(new Map<number, SatelliteMarkerHandle>());
  const selectedIdRef = useRef<number | null>(null);
  const mapThemeRef = useRef<"dark" | "light">("light");
  const mapReadyRef = useRef(false);

  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [feed, setFeed] = useState<SatelliteFeed | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<SatelliteSnapshot | null>(null);
  const [bearing, setBearing] = useState(0);
  const [visitorLocation, setVisitorLocation] = useState<
    [number, number] | null
  >(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const { resolvedTheme } = useTheme();

  const trackedSatellites = useMemo(
    () => createTrackedSatellites(feed?.records ?? []),
    [feed],
  );
  const selectedTracked = trackedSatellites.find(
    (tracked) => Number(tracked.record.NORAD_CAT_ID) === selectedId,
  );
  const fullscreen = nativeFullscreen || pseudoFullscreen;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSatellites = async () => {
      try {
        const response = await fetch("/api/map/satellites", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Satellite feed returned ${response.status}`);
        }
        const nextFeed = (await response.json()) as SatelliteFeed;
        if (!Array.isArray(nextFeed.records) || !nextFeed.records.length) {
          throw new Error("Satellite feed was empty");
        }
        setFeed(nextFeed);
      } catch (error) {
        if (controller.signal.aborted) return;
        setFeed(createFallbackSatelliteFeed());
      }
    };

    void loadSatellites();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return;
    let cancelled = false;
    let loadTimer = 0;

    const initialise = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !mapContainerRef.current) return;

      const initialTheme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
      mapThemeRef.current = initialTheme;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES[initialTheme],
        center: [77.2, 24.2],
        zoom: 2.8,
        minZoom: 1.5,
        maxZoom: 18,
        pitch: 8,
        maxPitch: 55,
        bearing: 0,
        dragPan: true,
        dragRotate: true,
        scrollZoom: true,
        boxZoom: true,
        doubleClickZoom: true,
        keyboard: true,
        touchZoomRotate: true,
        touchPitch: false,
        attributionControl: { compact: true },
        renderWorldCopies: false,
        fadeDuration: 180,
        zoomSnap: 0,
        cancelPendingTileRequestsWhileZooming: false,
        maxTileCacheZoomLevels: 4,
      });
      map.touchZoomRotate.enable();
      mapRef.current = map;

      const handleStyleLoad = () => {
        applyMapTheme(map, mapThemeRef.current);
      };
      const handleLoad = () => {
        mapReadyRef.current = true;
        window.clearTimeout(loadTimer);
        setMapLoaded(true);
        setMapUnavailable(false);
        document.documentElement.dataset.heroMapReady = "true";
        window.dispatchEvent(new Event("hero-map-ready"));
      };
      const handleRotateEnd = () => setBearing(map.getBearing());

      map.on("style.load", handleStyleLoad);
      map.on("load", handleLoad);
      map.on("rotateend", handleRotateEnd);

      loadTimer = window.setTimeout(() => {
        if (!mapReadyRef.current) setMapUnavailable(true);
      }, 8_000);
    };

    void initialise();
    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      mapReadyRef.current = false;
      satelliteMarkersRef.current.forEach(({ marker }) => marker.remove());
      satelliteMarkersRef.current.clear();
      visitorMarkerRef.current?.remove();
      akashMarkerRef.current?.remove();
      mapRef.current?.remove();
      visitorMarkerRef.current = null;
      akashMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [isClient]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const nextTheme = resolvedTheme === "dark" ? "dark" : "light";
    if (mapThemeRef.current === nextTheme) return;

    mapThemeRef.current = nextTheme;
    map.setStyle(MAP_STYLES[nextTheme]);
  }, [resolvedTheme, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || akashMarkerRef.current) return;
    let cancelled = false;

    const addMarker = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;
      const element = createLocationMarkerElement("akash");
      const centerAkash = (event: Event) => {
        event.stopPropagation();
        map.easeTo({
          center: AKASH_LOCATION,
          zoom: Math.max(map.getZoom(), 8),
          duration: 900,
          essential: true,
        });
      };
      element.addEventListener("click", centerAkash);
      akashMarkerRef.current = new maplibregl.Marker({
        element,
        anchor: "center",
      })
        .setLngLat(AKASH_LOCATION)
        .addTo(map);
    };

    void addMarker();
    return () => {
      cancelled = true;
    };
  }, [mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !visitorLocation) return;
    let cancelled = false;

    const addVisitorMarker = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;
      if (!visitorMarkerRef.current) {
        visitorMarkerRef.current = new maplibregl.Marker({
          element: createLocationMarkerElement("visitor"),
          anchor: "center",
        });
      }
      visitorMarkerRef.current.setLngLat(visitorLocation).addTo(map);
    };

    void addVisitorMarker();
    return () => {
      cancelled = true;
    };
  }, [mapLoaded, visitorLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !trackedSatellites.length) return;
    let cancelled = false;
    let positionTimer = 0;
    const clickHandlers = new Map<number, (event: Event) => void>();

    const installSatellites = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      satelliteMarkersRef.current.forEach(({ marker }) => marker.remove());
      satelliteMarkersRef.current.clear();

      for (const tracked of trackedSatellites) {
        const id = Number(tracked.record.NORAD_CAT_ID);
        const initialSnapshot = satelliteSnapshot(tracked, new Date());
        if (!initialSnapshot) continue;
        const markerElement = createSatelliteMarkerElement(
          tracked.record.OBJECT_NAME,
        );
        const handleClick = (event: Event) => {
          event.stopPropagation();
          setSelectedId(id);
          const snapshot = satelliteSnapshot(tracked, new Date());
          if (snapshot) setSelectedSnapshot(snapshot);
        };
        markerElement.element.addEventListener("click", handleClick);
        clickHandlers.set(id, handleClick);

        const marker = new maplibregl.Marker({
          element: markerElement.element,
          anchor: "bottom",
          offset: [0, 4],
        })
          .setLngLat([initialSnapshot.longitude, initialSnapshot.latitude])
          .addTo(map);
        markerElement.setBearing(initialSnapshot.bearing);
        satelliteMarkersRef.current.set(id, {
          marker,
          tracked,
          setBearing: markerElement.setBearing,
          setSelected: markerElement.setSelected,
        });
      }

      const updatePositions = () => {
        if (document.visibilityState === "hidden") return;
        const now = new Date();
        let nextSelectedSnapshot: SatelliteSnapshot | null = null;

        satelliteMarkersRef.current.forEach((handle, id) => {
          const snapshot = satelliteSnapshot(handle.tracked, now);
          if (!snapshot) {
            handle.marker.getElement().hidden = true;
            return;
          }
          handle.marker.getElement().hidden = false;
          handle.marker.setLngLat([snapshot.longitude, snapshot.latitude]);
          handle.setBearing(snapshot.bearing);
          handle.setSelected(id === selectedIdRef.current);
          if (id === selectedIdRef.current) {
            nextSelectedSnapshot = snapshot;
          }
        });

        if (selectedIdRef.current !== null) {
          setSelectedSnapshot(nextSelectedSnapshot);
        }
      };

      updatePositions();
      positionTimer = window.setInterval(updatePositions, 500);
    };

    void installSatellites();
    return () => {
      cancelled = true;
      window.clearInterval(positionTimer);
      satelliteMarkersRef.current.forEach((handle, id) => {
        const clickHandler = clickHandlers.get(id);
        if (clickHandler) {
          handle.marker.getElement().removeEventListener("click", clickHandler);
        }
        handle.marker.remove();
      });
      satelliteMarkersRef.current.clear();
    };
  }, [mapLoaded, trackedSatellites]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    satelliteMarkersRef.current.forEach((handle, id) => {
      handle.setSelected(id === selectedId);
    });
    if (selectedId === null) setSelectedSnapshot(null);
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const syncTrack = () =>
      syncSatelliteTrack(map, selectedTracked, mapThemeRef.current === "dark");

    syncTrack();
    map.on("style.load", syncTrack);
    const trackTimer = window.setInterval(syncTrack, 30_000);
    return () => {
      window.clearInterval(trackTimer);
      map.off("style.load", syncTrack);
    };
  }, [mapLoaded, selectedTracked, resolvedTheme]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setNativeFullscreen(document.fullscreenElement === rootRef.current);
      window.setTimeout(() => mapRef.current?.resize(), 0);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPseudoFullscreen(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    window.setTimeout(() => mapRef.current?.resize(), 0);
  }, [fullscreen]);

  useEffect(() => {
    if (!locationMessage) return;
    const timer = window.setTimeout(() => setLocationMessage(""), 4_000);
    return () => window.clearTimeout(timer);
  }, [locationMessage]);

  const zoomBy = (amount: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomTo(map.getZoom() + amount, {
      duration: 260,
      essential: true,
    });
  };

  const locateVisitor = () => {
    const map = mapRef.current;
    if (!map) return;

    if (visitorLocation) {
      map.easeTo({
        center: visitorLocation,
        zoom: Math.max(map.getZoom(), 8),
        duration: 900,
        essential: true,
      });
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
        map.easeTo({
          center: nextLocation,
          zoom: Math.max(map.getZoom(), 8),
          duration: 900,
          essential: true,
        });
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

  const toggleFullscreen = async () => {
    const root = rootRef.current;
    if (!root) return;

    if (pseudoFullscreen) {
      setPseudoFullscreen(false);
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (root.requestFullscreen) {
      try {
        await root.requestFullscreen();
        return;
      } catch {
        setPseudoFullscreen(true);
        return;
      }
    }
    setPseudoFullscreen(true);
  };

  const centerSelectedSatellite = () => {
    if (!selectedSnapshot) return;
    mapRef.current?.easeTo({
      center: [selectedSnapshot.longitude, selectedSnapshot.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 4.5),
      duration: 900,
      essential: true,
    });
  };

  const visitorDistance = visitorLocation
    ? distanceBetween(AKASH_LOCATION, visitorLocation)
    : null;
  const feedLabel = feed
    ? feed.stale
      ? "stale orbit cache"
      : feed.mode === "celestrak"
        ? `${trackedSatellites.length} live tracks`
        : `${trackedSatellites.length} offline tracks`
    : "loading orbits";

  if (!isClient) {
    return (
      <div className="bg-muted/50 h-48 animate-pulse overflow-hidden rounded-t-[11px]" />
    );
  }

  return (
    <div
      ref={rootRef}
      className={[
        "group relative isolate overflow-hidden bg-[#eef1ef] dark:bg-[#152027]",
        fullscreen ? "h-screen rounded-none" : "h-48 rounded-t-[11px]",
        pseudoFullscreen ? "fixed inset-3 z-[100] h-auto rounded-xl" : "",
      ].join(" ")}
    >
      <div className="absolute inset-0">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_52%_46%,transparent_48%,rgba(20,34,40,0.13)_100%)] dark:bg-[radial-gradient(circle_at_52%_46%,transparent_45%,rgba(2,10,15,0.32)_100%)]" />

      <MapControls
        bearing={bearing}
        disabled={!mapLoaded}
        fullscreen={fullscreen}
        locateDisabled={
          typeof navigator !== "undefined" && !("geolocation" in navigator)
        }
        locating={locating}
        onFullscreen={() => void toggleFullscreen()}
        onLocate={locateVisitor}
        onResetNorth={() =>
          mapRef.current?.easeTo({
            bearing: 0,
            pitch: 0,
            duration: 450,
            essential: true,
          })
        }
        onZoomIn={() => zoomBy(1)}
        onZoomOut={() => zoomBy(-1)}
      />

      {!selectedId && (
        <a
          href={feed?.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title="Orbital elements from CelesTrak"
          className="bg-background/90 border-border/70 text-muted-foreground hover:text-foreground absolute top-3 right-3 z-30 flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-medium shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition-colors"
        >
          {feed ? (
            <Satellite className="size-3.5 text-cyan-700 dark:text-cyan-300" />
          ) : (
            <LoaderCircle className="size-3.5 animate-spin" />
          )}
          <span>{feedLabel}</span>
        </a>
      )}

      {visitorDistance !== null && (
        <div className="bg-background/88 border-border/65 text-muted-foreground absolute bottom-2 left-12 z-20 rounded-md border px-2 py-1 text-[9px] shadow-sm backdrop-blur-md">
          {visitorDistance < 1
            ? `${Math.round(visitorDistance * 1_000)} m`
            : `${visitorDistance.toFixed(0)} km`}{" "}
          from Akash
        </div>
      )}

      {locationMessage && (
        <div
          role="status"
          className="bg-background/94 border-border/70 text-foreground absolute top-3 left-12 z-40 rounded-md border px-2.5 py-1.5 text-[10px] shadow-md"
        >
          {locationMessage}
        </div>
      )}

      {mapUnavailable && (
        <div
          role="status"
          className="bg-background/92 text-muted-foreground absolute inset-0 z-20 flex items-center justify-center text-sm backdrop-blur-sm"
        >
          Basemap unavailable. Satellite data can still load offline.
        </div>
      )}

      {feed &&
        selectedTracked &&
        selectedSnapshot &&
        selectedId === selectedSnapshot.noradId && (
          <SatellitePopup
            feed={feed}
            record={selectedTracked.record}
            snapshot={selectedSnapshot}
            onCenter={centerSelectedSatellite}
            onClose={() => setSelectedId(null)}
          />
        )}
    </div>
  );
}
