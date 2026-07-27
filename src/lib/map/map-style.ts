import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

export type MapTheme = "light" | "dark";

/**
 * Esri World Imagery covers z0-19 globally, so one source carries the whole
 * zoom range. Declaring the real z19 ceiling lets MapLibre upscale past it
 * rather than request tiles that do not exist.
 */
const IMAGERY_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];

/** Esri's own reference layer: boundaries and place names, transparent, no fill. */
const REFERENCE_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
];

/** Free global terrain, terrarium-encoded. Only attached in 3D mode. */
export const TERRAIN_TILES = [
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
];

/** Free vector tiles, used only for building footprints in 3D mode. */
export const BUILDING_TILES = "https://tiles.openfreemap.org/planet";

export const IMAGERY_MAX_ZOOM = 19;

const palette = {
  light: {
    background: "#0d1418",
    imageryOpacity: 1,
    saturation: -0.08,
    contrast: 0.04,
    brightnessMin: 0.02,
    brightnessMax: 1,
    referenceOpacity: 0.62,
    buildingColor: "#e8ece9",
  },
  dark: {
    background: "#0a1014",
    imageryOpacity: 0.92,
    saturation: -0.2,
    contrast: 0.08,
    brightnessMin: 0,
    brightnessMax: 0.76,
    referenceOpacity: 0.45,
    buildingColor: "#2b3740",
  },
} as const;

export function createMapStyle(theme: MapTheme): StyleSpecification {
  const colors = palette[theme];

  return {
    version: 8,
    name: "Esri World Imagery research view",
    sources: {
      imagery: {
        type: "raster",
        tiles: IMAGERY_TILES,
        tileSize: 256,
        minzoom: 0,
        maxzoom: IMAGERY_MAX_ZOOM,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
      reference: {
        type: "raster",
        tiles: REFERENCE_TILES,
        tileSize: 256,
        minzoom: 2,
        maxzoom: IMAGERY_MAX_ZOOM,
        attribution: "Boundaries and places © Esri",
      },
    },
    layers: [
      {
        id: "research-background",
        type: "background",
        paint: { "background-color": colors.background },
      },
      {
        id: "imagery",
        type: "raster",
        source: "imagery",
        paint: {
          "raster-opacity": colors.imageryOpacity,
          "raster-saturation": colors.saturation,
          "raster-contrast": colors.contrast,
          "raster-brightness-min": colors.brightnessMin,
          "raster-brightness-max": colors.brightnessMax,
          "raster-fade-duration": 0,
          "raster-resampling": "linear",
        },
      },
      {
        id: "reference",
        type: "raster",
        source: "reference",
        minzoom: 2,
        paint: {
          "raster-opacity": colors.referenceOpacity,
          "raster-fade-duration": 0,
        },
      },
    ],
  };
}

export function applyMapTheme(map: MapLibreMap, theme: MapTheme) {
  if (!map.isStyleLoaded()) return;
  const colors = palette[theme];

  if (map.getLayer("research-background")) {
    map.setPaintProperty(
      "research-background",
      "background-color",
      colors.background,
    );
  }

  if (map.getLayer("imagery")) {
    map.setPaintProperty("imagery", "raster-opacity", colors.imageryOpacity);
    map.setPaintProperty("imagery", "raster-saturation", colors.saturation);
    map.setPaintProperty("imagery", "raster-contrast", colors.contrast);
    map.setPaintProperty(
      "imagery",
      "raster-brightness-min",
      colors.brightnessMin,
    );
    map.setPaintProperty(
      "imagery",
      "raster-brightness-max",
      colors.brightnessMax,
    );
  }

  if (map.getLayer("reference")) {
    map.setPaintProperty("reference", "raster-opacity", colors.referenceOpacity);
  }

  if (map.getLayer("buildings-3d")) {
    map.setPaintProperty("buildings-3d", "fill-extrusion-color", colors.buildingColor);
  }
}

/**
 * Terrain and extruded buildings are only worth their bandwidth when the user
 * has actually asked for the 3D view, so both are attached on demand.
 */
export function enableThreeDimensions(map: MapLibreMap, theme: MapTheme) {
  if (!map.isStyleLoaded()) return;

  if (!map.getSource("terrain")) {
    map.addSource("terrain", {
      type: "raster-dem",
      tiles: TERRAIN_TILES,
      tileSize: 256,
      maxzoom: 13,
      encoding: "terrarium",
      attribution: "Elevation: Mapzen / AWS Terrain Tiles",
    });
  }
  map.setTerrain({ source: "terrain", exaggeration: 1.15 });

  if (!map.getSource("openmaptiles")) {
    map.addSource("openmaptiles", {
      type: "vector",
      url: BUILDING_TILES,
      attribution: "© OpenStreetMap contributors",
    });
  }

  if (!map.getLayer("buildings-3d")) {
    map.addLayer({
      id: "buildings-3d",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": palette[theme].buildingColor,
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.72,
        "fill-extrusion-vertical-gradient": true,
      },
    });
  }
}

export function disableThreeDimensions(map: MapLibreMap) {
  if (!map.isStyleLoaded()) return;
  map.setTerrain(null);
  if (map.getLayer("buildings-3d")) map.removeLayer("buildings-3d");
}
