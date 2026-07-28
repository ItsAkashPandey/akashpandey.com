import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

export type MapTheme = "light" | "dark";

/**
 * OpenFreeMap serves the OpenMapTiles schema with no key and no request cap.
 * The source stops at z14 but vector geometry overzooms losslessly, so the map
 * keeps sharpening to street level instead of hitting a "no data" wall the way
 * a raster basemap does.
 */
const VECTOR_SOURCE_URL = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

/** Optional imagery underlay, used only by the satellite view toggle. */
const IMAGERY_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];

// OpenFreeMap only ships Regular, Bold and Italic glyph stacks. Asking for a
// weight it does not serve leaves the labels unrendered.
const TEXT_FONT = ["Noto Sans Regular"];
const TEXT_FONT_STRONG = ["Noto Sans Bold"];

/**
 * Two instruments, one chassis. Dark is the operations console: near-black
 * ground, desaturated structure, and a single cyan carrying every live signal.
 * Light is the printed sheet the same data gets read from at a desk.
 */
const palette = {
  dark: {
    // Land is lifted off the ocean far enough that coastlines read at globe
    // zoom, where these two were previously within a few points of each other
    // and the whole planet rendered as one black disc.
    ground: "#182126",
    water: "#060b0f",
    green: "#1b2723",
    builtUp: "#141b20",
    building: "#1c262d",
    buildingTop: "#26333c",
    roadMinor: "#1d262c",
    roadMajor: "#2a3841",
    roadTrunk: "#3a4c58",
    boundary: "#31424c",
    label: "#93a7b3",
    labelHalo: "#070c0f",
    placeLabel: "#c6d5de",
    // Imagery is now a deliberate choice, so it is shown close to true tone
    // rather than dimmed to sit under the dark vector paint.
    imageryOpacity: 1,
    imagerySaturation: -0.12,
    imageryBrightnessMax: 0.94,
  },
  light: {
    ground: "#eaece6",
    water: "#b9cbd5",
    green: "#dde5d8",
    builtUp: "#e5e6e1",
    building: "#d8dcd8",
    buildingTop: "#e6eae6",
    roadMinor: "#f6f7f4",
    roadMajor: "#ffffff",
    roadTrunk: "#fdf6e4",
    boundary: "#b3bdc2",
    label: "#5b6a72",
    labelHalo: "#f3f5f1",
    placeLabel: "#2c3940",
    imageryOpacity: 1,
    imagerySaturation: -0.06,
    imageryBrightnessMax: 1,
  },
} as const;

export function createMapStyle(theme: MapTheme): StyleSpecification {
  const c = palette[theme];

  return {
    version: 8,
    name: "Research console",
    glyphs: GLYPHS,
    // A globe until the visitor drops toward street level, where MapLibre
    // hands over to mercator on its own.
    projection: { type: "globe" },
    sources: {
      basemap: {
        type: "vector",
        url: VECTOR_SOURCE_URL,
        attribution: "© OpenStreetMap contributors",
      },
      imagery: {
        type: "raster",
        tiles: IMAGERY_TILES,
        tileSize: 256,
        minzoom: 0,
        // Esri stops at z18 over most of India and answers z19+ with a 2521
        // byte "Map data not yet available" placeholder. Declaring 18 makes
        // MapLibre upscale the real tile instead of fetching that placeholder.
        maxzoom: 18,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
    },
    layers: [
      {
        id: "ground",
        type: "background",
        paint: { "background-color": c.ground },
      },
      {
        id: "imagery",
        type: "raster",
        source: "imagery",
        layout: { visibility: "none" },
        paint: {
          "raster-opacity": c.imageryOpacity,
          "raster-saturation": c.imagerySaturation,
          "raster-brightness-max": c.imageryBrightnessMax,
          "raster-fade-duration": 0,
          "raster-resampling": "linear",
        },
      },
      {
        id: "landcover-green",
        type: "fill",
        source: "basemap",
        "source-layer": "landcover",
        filter: ["match", ["get", "class"], ["wood", "grass"], true, false],
        paint: { "fill-color": c.green, "fill-opacity": 0.65 },
      },
      {
        id: "landuse-builtup",
        type: "fill",
        source: "basemap",
        "source-layer": "landuse",
        filter: [
          "match",
          ["get", "class"],
          ["residential", "commercial", "industrial"],
          true,
          false,
        ],
        paint: { "fill-color": c.builtUp, "fill-opacity": 0.5 },
      },
      {
        id: "water",
        type: "fill",
        source: "basemap",
        "source-layer": "water",
        paint: { "fill-color": c.water },
      },
      {
        id: "waterway",
        type: "line",
        source: "basemap",
        "source-layer": "waterway",
        minzoom: 8,
        paint: {
          "line-color": c.water,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 16, 3],
        },
      },
      {
        id: "building",
        type: "fill",
        source: "basemap",
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-color": c.building,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, 0.9],
          "fill-outline-color": c.buildingTop,
        },
      },
      {
        id: "road-minor",
        type: "line",
        source: "basemap",
        "source-layer": "transportation",
        minzoom: 11,
        filter: [
          "match",
          ["get", "class"],
          ["minor", "service", "track", "path"],
          true,
          false,
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.roadMinor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.4, 18, 6],
          "line-opacity": 0.85,
        },
      },
      {
        id: "road-major",
        type: "line",
        source: "basemap",
        "source-layer": "transportation",
        minzoom: 7,
        filter: [
          "match",
          ["get", "class"],
          ["secondary", "tertiary"],
          true,
          false,
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.roadMajor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.5, 18, 9],
        },
      },
      {
        id: "road-trunk",
        type: "line",
        source: "basemap",
        "source-layer": "transportation",
        minzoom: 5,
        filter: [
          "match",
          ["get", "class"],
          ["motorway", "trunk", "primary"],
          true,
          false,
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.roadTrunk,
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 18, 12],
        },
      },
      {
        id: "boundary",
        type: "line",
        source: "basemap",
        "source-layer": "boundary",
        filter: ["<=", ["get", "admin_level"], 4],
        paint: {
          "line-color": c.boundary,
          "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.4, 10, 1.2],
          "line-dasharray": [3, 2],
          "line-opacity": 0.7,
        },
      },
      {
        id: "street-label",
        type: "symbol",
        source: "basemap",
        "source-layer": "transportation_name",
        minzoom: 14,
        layout: {
          "text-field": ["get", "name"],
          "text-font": TEXT_FONT,
          "text-size": 10,
          "symbol-placement": "line",
          "text-letter-spacing": 0.04,
        },
        paint: {
          "text-color": c.label,
          "text-halo-color": c.labelHalo,
          "text-halo-width": 1.1,
        },
      },
      {
        id: "place-label",
        type: "symbol",
        source: "basemap",
        "source-layer": "place",
        filter: [
          "match",
          ["get", "class"],
          ["continent", "country", "state", "city", "town", "village"],
          true,
          false,
        ],
        layout: {
          "text-field": ["get", "name"],
          "text-font": TEXT_FONT_STRONG,
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            10,
            8,
            13,
            14,
            16,
          ],
          "text-letter-spacing": 0.08,
          "text-max-width": 8,
        },
        paint: {
          "text-color": c.placeLabel,
          "text-halo-color": c.labelHalo,
          "text-halo-width": 1.4,
        },
      },
    ],
  };
}

export function applyMapTheme(map: MapLibreMap, theme: MapTheme) {
  if (!map.isStyleLoaded()) return;
  const c = palette[theme];

  const set = (layer: string, property: string, value: unknown) => {
    if (map.getLayer(layer)) {
      map.setPaintProperty(layer, property, value as never);
    }
  };

  set("ground", "background-color", c.ground);
  set("water", "fill-color", c.water);
  set("waterway", "line-color", c.water);
  set("landcover-green", "fill-color", c.green);
  set("landuse-builtup", "fill-color", c.builtUp);
  set("building", "fill-color", c.building);
  set("building", "fill-outline-color", c.buildingTop);
  set("road-minor", "line-color", c.roadMinor);
  set("road-major", "line-color", c.roadMajor);
  set("road-trunk", "line-color", c.roadTrunk);
  set("boundary", "line-color", c.boundary);
  set("street-label", "text-color", c.label);
  set("street-label", "text-halo-color", c.labelHalo);
  set("place-label", "text-color", c.placeLabel);
  set("place-label", "text-halo-color", c.labelHalo);
  set("imagery", "raster-opacity", c.imageryOpacity);
  set("imagery", "raster-saturation", c.imagerySaturation);
  set("imagery", "raster-brightness-max", c.imageryBrightnessMax);
  set("buildings-3d", "fill-extrusion-color", c.building);
}

/** Opaque vector paint that would otherwise bury the imagery underneath it. */
const GROUND_COVER_LAYERS = [
  "landcover-green",
  "landuse-builtup",
  "water",
  "waterway",
  "building",
];

export function setImageryVisible(map: MapLibreMap, visible: boolean) {
  if (!map.isStyleLoaded() || !map.getLayer("imagery")) return;
  map.setLayoutProperty("imagery", "visibility", visible ? "visible" : "none");

  // The imagery sits at the bottom of the stack, so the vector fills have to
  // step aside or the visitor just sees the dark basemap again.
  for (const layer of GROUND_COVER_LAYERS) {
    if (map.getLayer(layer)) {
      map.setLayoutProperty(layer, "visibility", visible ? "none" : "visible");
    }
  }

  // Roads and labels stay, but they need to read against photography.
  for (const layer of ["road-minor", "road-major", "road-trunk"]) {
    if (map.getLayer(layer)) {
      map.setPaintProperty(layer, "line-opacity", visible ? 0.28 : 1);
    }
  }
}

/**
 * Extruded footprints with a vertical gradient and a height-driven tint, so a
 * dense block reads as massing rather than a field of white boxes.
 */
export function enableThreeDimensions(map: MapLibreMap, theme: MapTheme) {
  if (!map.isStyleLoaded()) return;
  const c = palette[theme];

  if (!map.getLayer("buildings-3d")) {
    map.addLayer({
      id: "buildings-3d",
      type: "fill-extrusion",
      source: "basemap",
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "render_height"], 6],
          0,
          c.building,
          40,
          c.buildingTop,
          140,
          c.roadTrunk,
        ],
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15.5,
          ["coalesce", ["get", "render_height"], 6],
        ],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.94,
        "fill-extrusion-vertical-gradient": true,
      },
    });
  }

  if (map.getLayer("building")) {
    map.setLayoutProperty("building", "visibility", "none");
  }
}

export function disableThreeDimensions(map: MapLibreMap) {
  if (!map.isStyleLoaded()) return;
  if (map.getLayer("buildings-3d")) map.removeLayer("buildings-3d");

  // Only hand the flat footprints back if imagery is not the active base.
  const imageryOn =
    map.getLayer("imagery") &&
    map.getLayoutProperty("imagery", "visibility") === "visible";
  if (map.getLayer("building") && !imageryOn) {
    map.setLayoutProperty("building", "visibility", "visible");
  }
}
