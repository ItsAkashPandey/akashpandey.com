import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

export type MapTheme = "light" | "dark";

const imageryDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1_000)
  .toISOString()
  .slice(0, 10);

const imageryTiles = [
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1/default/${imageryDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
];

// High-zoom ESRI World Imagery for detailed building views
const esriImageryTiles = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];

// OSM standard tiles for labels & roads overlay at high zoom
const osmTiles = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];

const palette = {
  light: {
    background: "#dce5e2",
    rasterOpacity: 0.94,
    saturation: -0.12,
    contrast: 0.08,
    brightnessMin: 0.08,
    brightnessMax: 0.94,
    esriOpacity: 0.96,
    labelOpacity: 0.5,
  },
  dark: {
    background: "#172127",
    rasterOpacity: 0.78,
    saturation: -0.34,
    contrast: 0.12,
    brightnessMin: 0.04,
    brightnessMax: 0.58,
    esriOpacity: 0.82,
    labelOpacity: 0.42,
  },
} as const;

export function createMapStyle(theme: MapTheme): StyleSpecification {
  const colors = palette[theme];

  return {
    version: 8,
    name: "NASA VIIRS + ESRI research view",
    sources: {
      "nasa-viirs": {
        type: "raster",
        tiles: imageryTiles,
        tileSize: 256,
        minzoom: 1,
        maxzoom: 9,
        attribution: "Imagery: NASA EOSDIS GIBS",
      },
      "esri-imagery": {
        type: "raster",
        tiles: esriImageryTiles,
        tileSize: 256,
        minzoom: 9,
        maxzoom: 22,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
      "osm-labels": {
        type: "raster",
        tiles: osmTiles,
        tileSize: 256,
        minzoom: 10,
        maxzoom: 22,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "research-background",
        type: "background",
        paint: { "background-color": colors.background },
      },
      {
        id: "nasa-viirs-imagery",
        type: "raster",
        source: "nasa-viirs",
        minzoom: 1,
        paint: {
          "raster-opacity": colors.rasterOpacity,
          "raster-saturation": colors.saturation,
          "raster-contrast": colors.contrast,
          "raster-brightness-min": colors.brightnessMin,
          "raster-brightness-max": colors.brightnessMax,
          "raster-fade-duration": 120,
          "raster-resampling": "linear",
        },
      },
      {
        id: "esri-imagery",
        type: "raster",
        source: "esri-imagery",
        minzoom: 9,
        maxzoom: 22,
        paint: {
          "raster-opacity": colors.esriOpacity,
          "raster-saturation": theme === "dark" ? -0.22 : -0.06,
          "raster-contrast": theme === "dark" ? 0.1 : 0.04,
          "raster-fade-duration": 80,
          "raster-resampling": "linear",
        },
      },
      {
        id: "osm-labels",
        type: "raster",
        source: "osm-labels",
        minzoom: 10,
        maxzoom: 19,
        paint: {
          "raster-opacity": colors.labelOpacity,
          "raster-fade-duration": 120,
        },
      },
    ],
  };
}

export function applyMapTheme(map: MapLibreMap, theme: MapTheme) {
  if (!map.isStyleLoaded()) return;
  const colors = palette[theme];

  map.setProjection({ type: "mercator" });

  if (map.getLayer("research-background")) {
    map.setPaintProperty(
      "research-background",
      "background-color",
      colors.background,
    );
  }
  if (map.getLayer("nasa-viirs-imagery")) {
    map.setPaintProperty(
      "nasa-viirs-imagery",
      "raster-opacity",
      colors.rasterOpacity,
    );
    map.setPaintProperty(
      "nasa-viirs-imagery",
      "raster-saturation",
      colors.saturation,
    );
    map.setPaintProperty(
      "nasa-viirs-imagery",
      "raster-contrast",
      colors.contrast,
    );
    map.setPaintProperty(
      "nasa-viirs-imagery",
      "raster-brightness-min",
      colors.brightnessMin,
    );
    map.setPaintProperty(
      "nasa-viirs-imagery",
      "raster-brightness-max",
      colors.brightnessMax,
    );
  }
  if (map.getLayer("esri-imagery")) {
    map.setPaintProperty("esri-imagery", "raster-opacity", colors.esriOpacity);
    map.setPaintProperty(
      "esri-imagery",
      "raster-saturation",
      theme === "dark" ? -0.22 : -0.06,
    );
    map.setPaintProperty(
      "esri-imagery",
      "raster-contrast",
      theme === "dark" ? 0.1 : 0.04,
    );
  }
  if (map.getLayer("osm-labels")) {
    map.setPaintProperty("osm-labels", "raster-opacity", colors.labelOpacity);
  }
}
