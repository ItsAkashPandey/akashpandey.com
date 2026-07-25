import type { Map as MapLibreMap } from "maplibre-gl";

export const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

type MapTheme = keyof typeof MAP_STYLES;

const palette = {
  light: {
    background: "#eef1ef",
    land: "#e8ece8",
    water: "#cbdadd",
    vegetation: "#d9e3da",
    building: "#e1e5e1",
    road: "#f9faf8",
    minorRoad: "#d8ddda",
    boundary: "#8d9b9b",
    waterway: "#aabfc4",
    text: "#3d4b4e",
    halo: "#f2f4f1",
    sky: "#dce7eb",
    horizon: "#f2f5f3",
  },
  dark: {
    background: "#152027",
    land: "#19242a",
    water: "#10242d",
    vegetation: "#1b2c29",
    building: "#202b30",
    road: "#334047",
    minorRoad: "#29363c",
    boundary: "#53666d",
    waterway: "#294650",
    text: "#aebdc0",
    halo: "#152027",
    sky: "#08151e",
    horizon: "#273b44",
  },
} satisfies Record<MapTheme, Record<string, string>>;

export function applyMapTheme(map: MapLibreMap, theme: MapTheme) {
  const colors = palette[theme];
  map.setProjection({ type: "globe" });
  map.setSky({
    "sky-color": colors.sky,
    "horizon-color": colors.horizon,
    "fog-color": colors.horizon,
    "fog-ground-blend": 0.55,
    "horizon-fog-blend": 0.72,
    "sky-horizon-blend": 0.66,
    "atmosphere-blend": 0.85,
  });

  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id.toLowerCase();

    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", colors.background);
      continue;
    }

    if (layer.type === "fill") {
      const color = id.includes("water")
        ? colors.water
        : id.includes("wood") || id.includes("park") || id.includes("grass")
          ? colors.vegetation
          : id.includes("building")
            ? colors.building
            : colors.land;
      map.setPaintProperty(layer.id, "fill-color", color);
      continue;
    }

    if (layer.type === "line") {
      const color = id.includes("water")
        ? colors.waterway
        : id.includes("boundary")
          ? colors.boundary
          : id.includes("major") || id.includes("motorway")
            ? colors.road
            : colors.minorRoad;
      map.setPaintProperty(layer.id, "line-color", color);
      continue;
    }

    if (layer.type === "symbol" && id.includes("name")) {
      map.setPaintProperty(layer.id, "text-color", colors.text);
      map.setPaintProperty(layer.id, "text-halo-color", colors.halo);
      map.setPaintProperty(layer.id, "text-halo-width", 1);
    }
  }
}
