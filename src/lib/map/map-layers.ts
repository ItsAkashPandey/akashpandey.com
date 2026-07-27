import { footprintCircle, greatCirclePoints } from "@/lib/map/map-geometry";
import type { SatelliteTrack } from "@/lib/map/satellite-orbits";
import type { SatelliteSnapshot } from "@/lib/map/satellite-types";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "./map-style";

const ORBIT_SOURCE = "selected-orbit";
const FOOTPRINT_SOURCE = "selected-footprint";
const CONNECTION_SOURCE = "visitor-connection";

function emptyLines(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return { type: "FeatureCollection", features: [] };
}

function emptyPolygon(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return { type: "FeatureCollection", features: [] };
}

function addSources(map: MapLibreMap) {
  if (!map.getSource(ORBIT_SOURCE)) {
    map.addSource(ORBIT_SOURCE, {
      type: "geojson",
      data: emptyLines(),
      lineMetrics: true,
    });
  }
  if (!map.getSource(FOOTPRINT_SOURCE)) {
    map.addSource(FOOTPRINT_SOURCE, {
      type: "geojson",
      data: emptyPolygon(),
    });
  }
  if (!map.getSource(CONNECTION_SOURCE)) {
    map.addSource(CONNECTION_SOURCE, {
      type: "geojson",
      data: emptyLines(),
    });
  }
}

export function ensureResearchLayers(map: MapLibreMap, theme: MapTheme) {
  if (!map.isStyleLoaded()) return;
  addSources(map);

  const orbitColor = theme === "dark" ? "#93e4da" : "#075f63";
  const connectionColor = theme === "dark" ? "#f0bc82" : "#9c4f23";

  if (!map.getLayer("selected-footprint-fill")) {
    map.addLayer({
      id: "selected-footprint-fill",
      type: "fill",
      source: FOOTPRINT_SOURCE,
      paint: {
        "fill-color": orbitColor,
        "fill-opacity": theme === "dark" ? 0.1 : 0.08,
      },
    });
  }
  if (!map.getLayer("selected-footprint-edge")) {
    map.addLayer({
      id: "selected-footprint-edge",
      type: "line",
      source: FOOTPRINT_SOURCE,
      paint: {
        "line-color": orbitColor,
        "line-width": 1,
        "line-opacity": 0.55,
        "line-dasharray": [2, 2],
      },
    });
  }
  if (!map.getLayer("visitor-connection-glow")) {
    map.addLayer({
      id: "visitor-connection-glow",
      type: "line",
      source: CONNECTION_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": connectionColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 4, 10, 7],
        "line-opacity": 0.18,
        "line-blur": 2,
      },
    });
  }
  if (!map.getLayer("visitor-connection-line")) {
    map.addLayer({
      id: "visitor-connection-line",
      type: "line",
      source: CONNECTION_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": connectionColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 1.2, 10, 2],
        "line-opacity": 0.9,
        "line-dasharray": [2, 1.8],
      },
    });
  }
  if (!map.getLayer("selected-orbit-glow")) {
    map.addLayer({
      id: "selected-orbit-glow",
      type: "line",
      source: ORBIT_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": orbitColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 5, 10, 9],
        "line-opacity": 0.2,
        "line-blur": 2,
      },
    });
  }
  if (!map.getLayer("selected-orbit-past")) {
    map.addLayer({
      id: "selected-orbit-past",
      type: "line",
      source: ORBIT_SOURCE,
      filter: ["==", ["get", "phase"], "past"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": orbitColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 1.4, 10, 2.5],
        "line-opacity": 0.62,
        "line-dasharray": [1.4, 1.6],
      },
    });
  }
  if (!map.getLayer("selected-orbit-future")) {
    map.addLayer({
      id: "selected-orbit-future",
      type: "line",
      source: ORBIT_SOURCE,
      filter: ["==", ["get", "phase"], "future"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": orbitColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 2, 10, 3],
        "line-opacity": 0.96,
      },
    });
  }

  map.setPaintProperty("selected-footprint-fill", "fill-color", orbitColor);
  map.setPaintProperty(
    "selected-footprint-fill",
    "fill-opacity",
    theme === "dark" ? 0.1 : 0.08,
  );
  map.setPaintProperty("selected-footprint-edge", "line-color", orbitColor);
  for (const layer of [
    "selected-orbit-glow",
    "selected-orbit-past",
    "selected-orbit-future",
  ]) {
    map.setPaintProperty(layer, "line-color", orbitColor);
  }
  for (const layer of ["visitor-connection-glow", "visitor-connection-line"]) {
    map.setPaintProperty(layer, "line-color", connectionColor);
  }
}

export function updateSelectedOrbit(
  map: MapLibreMap,
  track: SatelliteTrack | null,
  snapshot: SatelliteSnapshot | null,
  /** Coverage reads as a sensor swath only once the view is tilted or turned. */
  showFootprint = true,
) {
  const orbitSource = map.getSource(ORBIT_SOURCE) as GeoJSONSource | undefined;
  orbitSource?.setData(track ?? emptyLines());

  const footprintSource = map.getSource(FOOTPRINT_SOURCE) as
    | GeoJSONSource
    | undefined;
  footprintSource?.setData(
    snapshot && showFootprint
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [
                  footprintCircle(
                    [snapshot.longitude, snapshot.latitude],
                    Math.min(700, Math.max(220, snapshot.altitudeKm * 0.72)),
                  ),
                ],
              },
            },
          ],
        }
      : emptyPolygon(),
  );
}

export function updateVisitorConnection(
  map: MapLibreMap,
  akash: [number, number],
  visitor: [number, number] | null,
) {
  const source = map.getSource(CONNECTION_SOURCE) as GeoJSONSource | undefined;
  source?.setData(
    visitor
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: greatCirclePoints(akash, visitor),
              },
            },
          ],
        }
      : emptyLines(),
  );
}
