import type {
  SatelliteFeed,
  SatelliteOmm,
  SatelliteSnapshot,
} from "@/lib/map/satellite-types";
import { Crosshair, Satellite, X } from "lucide-react";

type SatellitePopupProps = {
  feed: SatelliteFeed;
  record: SatelliteOmm;
  snapshot: SatelliteSnapshot;
  onCenter: () => void;
  onClose: () => void;
};

function coordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(2)}°${value >= 0 ? positive : negative}`;
}

function epochLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(date);
}

export default function SatellitePopup({
  feed,
  record,
  snapshot,
  onCenter,
  onClose,
}: SatellitePopupProps) {
  const values = [
    ["Latitude", coordinate(snapshot.latitude, "N", "S")],
    ["Longitude", coordinate(snapshot.longitude, "E", "W")],
    ["Altitude", `${snapshot.altitudeKm.toFixed(0)} km`],
    ["Orbital speed", `${snapshot.speedKmS.toFixed(2)} km/s`],
    ["Inclination", `${Number(record.INCLINATION).toFixed(2)}°`],
    ["Ascending node", `${Number(record.RA_OF_ASC_NODE).toFixed(2)}°`],
  ];

  return (
    <aside
      aria-label={`${snapshot.name} orbital details`}
      className="bg-background/94 border-border/70 absolute right-3 bottom-3 z-30 w-[min(19rem,calc(100%-4.5rem))] rounded-lg border p-3 shadow-[0_14px_38px_rgba(15,23,42,0.2)] backdrop-blur-md"
    >
      <div className="flex items-start gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-cyan-700/10 text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">
          <Satellite className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-semibold">
            {snapshot.name}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[9px]">
            NORAD {snapshot.noradId} · full ground track shown
          </p>
        </div>
        <button
          type="button"
          title="Center satellite"
          aria-label={`Center ${snapshot.name}`}
          onClick={onCenter}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
        >
          <Crosshair className="size-3.5" />
        </button>
        <button
          type="button"
          title="Close satellite details"
          aria-label="Close satellite details"
          onClick={onClose}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <dl className="border-border/60 mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 border-t pt-2">
        {values.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-muted-foreground text-[8px] leading-tight">
              {label}
            </dt>
            <dd className="mt-0.5 truncate font-mono text-[10px] font-medium tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-muted-foreground mt-2 truncate text-[8px]">
        {feed.mode === "celestrak" ? "CelesTrak GP" : "Offline GP cache"} · OMM
        epoch {epochLabel(record.EPOCH)} UTC
      </p>
    </aside>
  );
}
