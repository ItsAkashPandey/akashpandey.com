import type {
  ExpressionSpecification,
  Map as MapLibreMap,
  StyleSpecification,
} from "maplibre-gl";

export type MapTheme = "light" | "dark";

/**
 * OpenFreeMap serves the OpenMapTiles schema with no key and no request cap.
 * The source stops at z14 but vector geometry overzooms losslessly, so the map
 * keeps sharpening to street level instead of hitting a "no data" wall the way
 * a raster basemap does.
 */
const VECTOR_SOURCE_URL = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

// OpenFreeMap only ships Regular, Bold and Italic glyph stacks. Asking for a
// weight it does not serve leaves the labels unrendered.
const TEXT_FONT = ["Noto Sans Regular"];
const TEXT_FONT_STRONG = ["Noto Sans Bold"];

/**
 * OpenMapTiles' plain `name` is whatever OSM tagged as the *local* name —
 * Devanagari in most of India, Cyrillic in Russia, and so on, mixed with
 * Latin script everywhere else. A map read by an English-speaking visitor
 * needs one consistent script; `name:en` carries that when OSM has it, and
 * only place names that OpenStreetMap never translated fall through to the
 * local tag.
 */
const LABEL_FIELD: ExpressionSpecification = [
  "coalesce",
  ["get", "name:en"],
  ["get", "name"],
];

/**
 * Two instruments, one chassis. Light is paper on a desk — warm stock, muted
 * ink, water like a pale wash. Dark is the same plate under a lamp: the ink
 * inverts, the hierarchy does not. Plain single-line roads and sentence-case
 * labels throughout — the plainer read wears better than a stylised one.
 */
const palette = {
  dark: {
    ground: "#1b2429",
    water: "#0d2530",
    green: "#1e2b26",
    builtUp: "#212b31",
    roadMinor: "#2b363d",
    roadMajor: "#3a4952",
    roadTrunk: "#5d5138",
    boundary: "#3c4c55",
    label: "#93a7b3",
    labelHalo: "#0a1114",
    placeLabel: "#c6d5de",
    placeLabelMajor: "#e7eef1",
  },
  light: {
    ground: "#f1ede2",
    water: "#aecdd4",
    green: "#e1e7d4",
    builtUp: "#e9e3d5",
    roadMinor: "#fdfcf8",
    roadMajor: "#ffffff",
    roadTrunk: "#f2dfae",
    boundary: "#b3bdac",
    label: "#5b6a5e",
    labelHalo: "#f4f1e8",
    placeLabel: "#2c3930",
    placeLabelMajor: "#1b2921",
  },
} as const;

export function createMapStyle(theme: MapTheme): StyleSpecification {
  const c = palette[theme];

  return {
    version: 8,
    name: "Paper map",
    glyphs: GLYPHS,
    sources: {
      basemap: {
        type: "vector",
        url: VECTOR_SOURCE_URL,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "ground",
        type: "background",
        paint: { "background-color": c.ground },
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
        // Raised from 7: at the country-wide view this widget opens on,
        // z7 painted every secondary road in India at once — the exact
        // "busy old GPS unit" clutter a quiet distance map should not have.
        minzoom: 9,
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
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 18, 9],
        },
      },
      {
        id: "road-trunk",
        type: "line",
        source: "basemap",
        "source-layer": "transportation",
        // Same story one tier up: highways stay off until the view has
        // already zoomed past "here's the country" into "here's the city".
        minzoom: 7,
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
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.4, 18, 12],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 8, 1],
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
          "line-opacity": 0.55,
        },
      },
      {
        id: "street-label",
        type: "symbol",
        source: "basemap",
        "source-layer": "transportation_name",
        minzoom: 14,
        layout: {
          "text-field": LABEL_FIELD,
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
        // Continent/country/state: the labels that carry the "here's
        // roughly where this is on Earth" read at a zoomed-out view. Bolder
        // and always on, so the map keeps its bearings before a single
        // marker is visible.
        id: "place-label-major",
        type: "symbol",
        source: "basemap",
        "source-layer": "place",
        filter: [
          "match",
          ["get", "class"],
          ["continent", "country", "state"],
          true,
          false,
        ],
        layout: {
          "text-field": LABEL_FIELD,
          "text-font": TEXT_FONT_STRONG,
          "text-size": ["interpolate", ["linear"], ["zoom"], 2, 11, 6, 14],
          "text-letter-spacing": 0.09,
          "text-max-width": 8,
        },
        paint: {
          "text-color": c.placeLabelMajor,
          "text-halo-color": c.labelHalo,
          "text-halo-width": 1.4,
        },
      },
      {
        // City/town/village only earns screen space once the view has
        // zoomed in enough that a country-wide label sweep would otherwise
        // paper the whole map in place names.
        id: "place-label-minor",
        type: "symbol",
        source: "basemap",
        "source-layer": "place",
        minzoom: 5,
        filter: [
          "match",
          ["get", "class"],
          ["city", "town", "village"],
          true,
          false,
        ],
        layout: {
          "text-field": LABEL_FIELD,
          "text-font": TEXT_FONT_STRONG,
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 10, 14, 16],
          "text-letter-spacing": 0.06,
          "text-max-width": 8,
        },
        paint: {
          "text-color": c.placeLabel,
          "text-halo-color": c.labelHalo,
          "text-halo-width": 1.3,
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
  set("road-minor", "line-color", c.roadMinor);
  set("road-major", "line-color", c.roadMajor);
  set("road-trunk", "line-color", c.roadTrunk);
  set("boundary", "line-color", c.boundary);
  set("street-label", "text-color", c.label);
  set("street-label", "text-halo-color", c.labelHalo);
  set("place-label-major", "text-color", c.placeLabelMajor);
  set("place-label-major", "text-halo-color", c.labelHalo);
  set("place-label-minor", "text-color", c.placeLabel);
  set("place-label-minor", "text-halo-color", c.labelHalo);
}
