"use client";

import MapControls from "@/components/map/MapControls";
import SatellitePopup from "@/components/map/SatellitePopup";
import SatelliteScene from "@/components/map/SatelliteScene";
import { createFallbackSatelliteFeed } from "@/data/satellite-fallback";
import {
  distanceKm,
  formatDistance,
  greatCircleMidpoint,
} from "@/lib/map/map-geometry";
import {
  ensureResearchLayers,
  updateSelectedOrbit,
  updateVisitorConnection,
} from "@/lib/map/map-layers";
import { createLocationMarkerElement } from "@/lib/map/map-markers";
import {
  applyMapTheme,
  createMapStyle,
  type MapTheme,
} from "@/lib/map/map-style";
import {
  createTrackedSatellites,
  satelliteGroundTrack,
  satelliteSnapshot,
  type SatelliteTrack,
} from "@/lib/map/satellite-orbits";
import type {
  SatelliteFeed,
  SatelliteSnapshot,
} from "@/lib/map/satellite-types";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const AKASH_LOCATION: [longitude: number, latitude: number] = [
  77.900244, 29.862397,
];

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
      padding: { top: 52, right: 56, bottom: 52, left: 56 },
      maxZoom: 8.5,
      duration: 950,
      essential: true,
    },
  );
}

export default function LocationMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const akashMarkerRef = useRef<Marker | null>(null);
  const visitorMarkerRef = useRef<Marker | null>(null);
  const visitorLocationRef = useRef<[number, number] | null>(null);
  const orbitTrackRef = useRef<SatelliteTrack | null>(null);
  const selectedSnapshotRef = useRef<SatelliteSnapshot | null>(null);
  const mapThemeRef = useRef<MapTheme>("light");
  const mapReadyRef = useRef(false);

  const [isClient, setIsClient] = useState(false);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [feed, setFeed] = useState<SatelliteFeed | null>(null);
  const [snapshots, setSnapshots] = useState<SatelliteSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bearing, setBearing] = useState(0);
  const [visitorLocation, setVisitorLocation] = useState<
    [number, number] | null
  >(null);
  const [distanceLabelPosition, setDistanceLabelPosition] = useState({
    x: 0,
    y: 0,
  });
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
  const selectedSnapshot =
    snapshots.find((snapshot) => snapshot.noradId === selectedId) ?? null;
  const visitorDistance = visitorLocation
    ? distanceKm(AKASH_LOCATION, visitorLocation)
    : null;
  const fullscreen = nativeFullscreen || pseudoFullscreen;

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    visitorLocationRef.current = visitorLocation;
  }, [visitorLocation]);

  useEffect(() => {
    selectedSnapshotRef.current = selectedSnapshot;
  }, [selectedSnapshot]);

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
      } catch {
        if (!controller.signal.aborted) setFeed(createFallbackSatelliteFeed());
      }
    };

    void loadSatellites();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!trackedSatellites.length) return;

    const update = () => {
      if (document.visibilityState === "hidden") return;
      const now = new Date();
      setSnapshots(
        trackedSatellites.flatMap((tracked) => {
          const snapshot = satelliteSnapshot(tracked, now);
          return snapshot ? [snapshot] : [];
        }),
      );
    };

    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [trackedSatellites]);

  useEffect(() => {
    if (selectedId !== null || !snapshots.length) return;
    setSelectedId(snapshots[0].noradId);
  }, [selectedId, snapshots]);

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
        zoom: 13.2,
        minZoom: 1,
        maxZoom: 21,
        pitch: 48,
        maxPitch: 72,
        bearing: 0,
        dragPan: true,
        dragRotate: true,
        scrollZoom: true,
        boxZoom: true,
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
      map.touchZoomRotate.enable();
      mapRef.current = map;

      const handleLoad = () => {
        mapReadyRef.current = true;
        window.clearTimeout(loadTimer);
        applyMapTheme(map, mapThemeRef.current);
        ensureResearchLayers(map, mapThemeRef.current);
        setMapInstance(map);
        setMapLoaded(true);
        setMapUnavailable(false);
        document.documentElement.dataset.heroMapReady = "true";
        window.dispatchEvent(new Event("hero-map-ready"));
      };
      const handleRotate = () => setBearing(map.getBearing());

      map.on("load", handleLoad);
      map.on("rotate", handleRotate);
      loadTimer = window.setTimeout(() => {
        if (!mapReadyRef.current) setMapUnavailable(true);
      }, 8_000);
    };

    void initialise();
    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      mapReadyRef.current = false;
      akashMarkerRef.current?.remove();
      visitorMarkerRef.current?.remove();
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
            pitch: Math.max(map.getPitch(), 48),
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
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    ensureResearchLayers(map, mapThemeRef.current);

    const updateTrack = () => {
      orbitTrackRef.current = selectedTracked
        ? satelliteGroundTrack(selectedTracked, new Date())
        : null;
      updateSelectedOrbit(
        map,
        orbitTrackRef.current,
        selectedSnapshotRef.current,
      );
    };
    updateTrack();
    const timer = window.setInterval(updateTrack, 15_000);
    return () => window.clearInterval(timer);
  }, [mapLoaded, selectedTracked, selectedId, resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    updateSelectedOrbit(map, orbitTrackRef.current, selectedSnapshot);
  }, [mapLoaded, selectedSnapshot]);

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

  const selectSatellite = useCallback((noradId: number) => {
    setSelectedId(noradId);
  }, []);

  if (!isClient) {
    return (
      <div className="h-64 animate-pulse overflow-hidden rounded-t-md bg-[#dce5e2] dark:bg-[#172127]" />
    );
  }

  return (
    <div
      ref={rootRef}
      className={[
        "group relative isolate overflow-hidden bg-[#dce5e2] dark:bg-[#172127]",
        fullscreen ? "h-screen rounded-none" : "h-64 rounded-t-md",
        pseudoFullscreen ? "fixed inset-3 z-[100] h-auto rounded-md" : "",
      ].join(" ")}
    >
      <div
        ref={mapContainerRef}
        className="absolute inset-0 size-full"
        style={{ position: "absolute" }}
      />

      {mapInstance && snapshots.length > 0 && (
        <SatelliteScene
          map={mapInstance}
          snapshots={snapshots}
          selectedId={selectedId}
          onSelect={selectSatellite}
        />
      )}

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
            duration: 420,
            essential: true,
          })
        }
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
          Satellite imagery is temporarily unavailable. Orbital data will retry
          automatically.
        </div>
      )}

      {feed && selectedTracked && selectedSnapshot && (
        <SatellitePopup
          feed={feed}
          record={selectedTracked.record}
          snapshot={selectedSnapshot}
          onCenter={() =>
            mapRef.current?.easeTo({
              center: [selectedSnapshot.longitude, selectedSnapshot.latitude],
            zoom: Math.max(mapRef.current.getZoom(), 6),
              duration: 850,
              essential: true,
            })
          }
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
