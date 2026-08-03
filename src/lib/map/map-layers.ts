import { greatCirclePoints } from "@/lib/map/map-geometry";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "./map-style";

const CONNECTION_SOURCE = "visitor-connection";

function emptyLines(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return { type: "FeatureCollection", features: [] };
}

/**
 * One drawn layer sits on top of the basemap: the great circle between Roorkee
 * and whoever is looking at the page.
 */
export function ensureResearchLayers(map: MapLibreMap, theme: MapTheme) {
  if (!map.isStyleLoaded()) return;

  if (!map.getSource(CONNECTION_SOURCE)) {
    map.addSource(CONNECTION_SOURCE, { type: "geojson", data: emptyLines() });
  }

  const connectionColor = theme === "dark" ? "#e6b678" : "#9c5b23";

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

  for (const layer of ["visitor-connection-glow", "visitor-connection-line"]) {
    map.setPaintProperty(layer, "line-color", connectionColor);
  }
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
