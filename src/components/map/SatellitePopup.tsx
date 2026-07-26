import { satelliteLabel } from "@/lib/map/satellite-display";
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
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(new Date(value));
}

export default function SatellitePopup({
  feed,
  record,
  snapshot,
  onCenter,
  onClose,
}: SatellitePopupProps) {
  const label = satelliteLabel(snapshot.noradId, snapshot.name);
  const values = [
    ["Latitude", coordinate(snapshot.latitude, "N", "S")],
    ["Longitude", coordinate(snapshot.longitude, "E", "W")],
    ["Altitude", `${snapshot.altitudeKm.toFixed(0)} km`],
    ["Speed", `${snapshot.speedKmS.toFixed(2)} km/s`],
    ["Inclination", `${Number(record.INCLINATION).toFixed(2)}°`],
    ["Epoch", `${epochLabel(record.EPOCH)} UTC`],
  ];

  return (
    <aside
      aria-label={`${label} orbital details`}
      className="bg-background/94 border-border/70 absolute right-3 bottom-3 z-30 w-[min(18rem,calc(100%-4.5rem))] rounded-md border p-3 shadow-[0_14px_38px_rgba(15,23,42,0.2)] backdrop-blur-md"
    >
      <div className="flex items-start gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-cyan-700/10 text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">
          <Satellite className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-semibold">
            {label}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[9px]">
            NORAD {snapshot.noradId} · orbit and sensor footprint
          </p>
        </div>
        <button
          type="button"
          title="Center satellite"
          aria-label={`Center ${label}`}
          onClick={onCenter}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-sm transition-colors"
        >
          <Crosshair className="size-3.5" />
        </button>
        <button
          type="button"
          title="Close satellite details"
          aria-label="Close satellite details"
          onClick={onClose}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-sm transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <dl className="border-border/60 mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 border-t pt-2">
        {values.map(([name, value]) => (
          <div key={name} className="min-w-0">
            <dt className="text-muted-foreground text-[8px] leading-tight">
              {name}
            </dt>
            <dd className="mt-0.5 truncate font-mono text-[10px] font-medium tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-muted-foreground mt-2 truncate text-[8px]">
        {feed.mode === "celestrak" ? "CelesTrak GP" : "Offline GP cache"} · OMM
      </p>
    </aside>
  );
}
