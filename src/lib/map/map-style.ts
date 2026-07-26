import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

export type MapTheme = "light" | "dark";

const imageryDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1_000)
  .toISOString()
  .slice(0, 10);

const imageryTiles = [
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1/default/${imageryDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
];

const palette = {
  light: {
    background: "#dce5e2",
    rasterOpacity: 0.94,
    saturation: -0.12,
    contrast: 0.08,
    brightnessMin: 0.08,
    brightnessMax: 0.94,
  },
  dark: {
    background: "#172127",
    rasterOpacity: 0.78,
    saturation: -0.34,
    contrast: 0.12,
    brightnessMin: 0.04,
    brightnessMax: 0.58,
  },
} as const;

export function createMapStyle(theme: MapTheme): StyleSpecification {
  const colors = palette[theme];

  return {
    version: 8,
    name: "NASA VIIRS false-colour research view",
    sources: {
      "nasa-viirs": {
        type: "raster",
        tiles: imageryTiles,
        tileSize: 256,
        minzoom: 1,
        maxzoom: 9,
        attribution: "Imagery: NASA EOSDIS GIBS",
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
}
