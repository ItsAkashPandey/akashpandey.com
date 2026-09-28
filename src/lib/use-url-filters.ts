"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Filter state mirrored into the query string, so a filtered view can be
 * shared and the Back button comes back to it. `keys` maps each filter to its
 * query parameter; values equal to the default are left out of the URL.
 *
 * `replaceState` keeps the Next router's search params in sync without a
 * navigation per keystroke, and writes are debounced because some browsers
 * throttle rapid history updates.
 */
export function useUrlFilters<T extends Record<string, string>>(
  defaults: T,
  keys: { [K in keyof T]: string },
  sanitize: (raw: Partial<T>) => Partial<T>,
) {
  const [filters, setFilters] = useState<T>(defaults);
  const defaultsRef = useRef(defaults);
  const keysRef = useRef(keys);
  const sanitizeRef = useRef(sanitize);
  const restored = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw: Partial<T> = {};
    for (const [name, param] of Object.entries(keysRef.current) as [
      keyof T,
      string,
    ][]) {
      const value = params.get(param);
      if (value !== null) raw[name] = value as T[keyof T];
    }
    const clean = sanitizeRef.current(raw);
    if (Object.keys(clean).length) {
      setFilters((current) => ({ ...current, ...clean }));
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      for (const [name, param] of Object.entries(keysRef.current) as [
        keyof T,
        string,
      ][]) {
        const value = filters[name].trim();
        if (value && value !== defaultsRef.current[name]) {
          url.searchParams.set(param, value);
        } else {
          url.searchParams.delete(param);
        }
      }
      if (url.href !== window.location.href) {
        window.history.replaceState(null, "", url);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const update = useCallback(
    (patch: Partial<T>) => setFilters((current) => ({ ...current, ...patch })),
    [],
  );
  const reset = useCallback(() => setFilters(defaultsRef.current), []);

  return [filters, update, reset] as const;
}
