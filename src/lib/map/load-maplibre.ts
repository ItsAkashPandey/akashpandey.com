let loading: Promise<typeof import("maplibre-gl")> | null = null;

/**
 * MapLibre 6 runs its tile worker from a separate module that imports a
 * sibling file. Turbopack can't bundle that pair, so
 * scripts/copy-maplibre-worker.mjs copies both into public/maplibre and the
 * library is pointed there before the first map is created.
 */
export function loadMapLibre() {
  loading ??= import("maplibre-gl").then((maplibregl) => {
    maplibregl.setWorkerUrl(
      `/maplibre/maplibre-gl-worker.mjs?v=${maplibregl.getVersion()}`,
    );
    return maplibregl;
  });
  return loading;
}
