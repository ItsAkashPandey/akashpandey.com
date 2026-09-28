"use client";

import { useEffect, useState } from "react";

/**
 * The page is built once, so a year computed at build time goes stale on
 * 1 January. This renders the build year, then the visitor's current year.
 */
export default function CurrentYear() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <span suppressHydrationWarning>{year}</span>;
}
