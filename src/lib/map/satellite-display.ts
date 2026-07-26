const labels: Record<number, string> = {
  25994: "Terra · MODIS",
  27424: "Aqua · MODIS",
  39084: "Landsat 8",
  40053: "SPOT 7",
  49260: "Landsat 9",
  58271: "PlanetScope · SuperDove",
  60989: "Sentinel-2C",
  65053: "NISAR",
};

export function satelliteLabel(noradId: number, fallback: string) {
  return labels[noradId] ?? fallback;
}

export type SatelliteFamily =
  | "modis"
  | "landsat"
  | "sentinel"
  | "spot"
  | "planet"
  | "nisar";

export function satelliteFamily(
  noradId: number,
  name: string,
): SatelliteFamily {
  if (noradId === 25994 || noradId === 27424) return "modis";
  if (name.includes("LANDSAT")) return "landsat";
  if (name.includes("SENTINEL")) return "sentinel";
  if (name.includes("SPOT")) return "spot";
  if (noradId === 58271) return "planet";
  return "nisar";
}
