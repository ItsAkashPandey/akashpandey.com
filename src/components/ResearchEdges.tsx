"use client";

import { usePathname } from "next/navigation";

const routeNames = new Set([
  "home",
  "activities",
  "publications",
  "skills",
  "contact",
  "privacy",
]);

export default function ResearchEdges() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const segment = pathname.split("/").filter(Boolean)[0] ?? "home";
  const route = routeNames.has(segment) ? segment : "home";

  return (
    <div className="research-edges" data-route={route} aria-hidden="true">
      <span className="research-edge research-edge--left">
        <span className="research-edge__axis" />
        <span className="research-edge__trace" />
        <span className="research-edge__tick research-edge__tick--a" />
        <span className="research-edge__tick research-edge__tick--b" />
      </span>
      <span className="research-edge research-edge--right">
        <span className="research-edge__axis" />
        <span className="research-edge__trace" />
        <span className="research-edge__tick research-edge__tick--a" />
        <span className="research-edge__tick research-edge__tick--b" />
      </span>
    </div>
  );
}
