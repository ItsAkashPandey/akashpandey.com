type MapLibre = typeof import("maplibre-gl");

let loading: Promise<MapLibre> | null = null;

/**
 * MapLibre comes from its own files in public/maplibre
 * (scripts/copy-maplibre-worker.mjs), not from the bundle. Its tile worker
 * starts from the same folder, and the library and the worker both import
 * maplibre-gl-shared.mjs, so the browser fetches that half of MapLibre once.
 * Bundled, the page carried its own copy and the worker downloaded it again;
 * Turbopack can't bundle the worker, whose URL MapLibre works out at run time.
 */
export function loadMapLibre() {
  const url = "/maplibre/maplibre-gl.mjs";
  loading ??= (
    import(/* webpackIgnore: true */ url) as Promise<MapLibre>
  ).catch((error) => {
    // Let "Try again" on the map load it afresh.
    loading = null;
    throw error;
  });
  return loading;
}
