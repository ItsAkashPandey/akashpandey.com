import {
  House,
  LoaderCircle,
  Map as MapIcon,
  Minus,
  Plus,
  Satellite,
  Waypoints,
} from "lucide-react";
import type { ReactNode } from "react";

type MapControlsProps = {
  disabled: boolean;
  imagery: boolean;
  locateDisabled: boolean;
  locating: boolean;
  onLocate: () => void;
  onToggleImagery: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

const buttonClass =
  "text-foreground hover:bg-accent focus-visible:ring-ring flex size-9 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

function ControlButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={buttonClass}
    >
      {children}
    </button>
  );
}

const groupClass =
  "bg-background/90 border-border/70 divide-border/65 flex flex-col divide-y overflow-hidden rounded-lg border shadow-[0_8px_24px_hsl(var(--foreground)/0.14)] backdrop-blur-md";

export default function MapControls({
  disabled,
  imagery,
  locateDisabled,
  locating,
  onLocate,
  onToggleImagery,
  onZoomIn,
  onZoomOut,
  onReset,
}: MapControlsProps) {
  return (
    <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
      <div role="group" aria-label="Map view" className={groupClass}>
        <ControlButton label="Zoom in" disabled={disabled} onClick={onZoomIn}>
          <Plus className="size-4" />
        </ControlButton>
        <ControlButton label="Zoom out" disabled={disabled} onClick={onZoomOut}>
          <Minus className="size-4" />
        </ControlButton>
        <ControlButton
          label="Back to the starting view"
          disabled={disabled}
          onClick={onReset}
        >
          <House className="size-4" />
        </ControlButton>
      </div>

      <div role="group" aria-label="Map layers" className={groupClass}>
        <ControlButton
          label="Show the distance between you and Akash"
          disabled={disabled || locateDisabled || locating}
          onClick={onLocate}
        >
          {locating ? (
            <LoaderCircle className="text-ink size-4 animate-spin" />
          ) : (
            <Waypoints className="text-ink size-4" />
          )}
        </ControlButton>
        <ControlButton
          label={imagery ? "Switch to the map" : "Switch to satellite imagery"}
          pressed={imagery}
          disabled={disabled}
          onClick={onToggleImagery}
        >
          {imagery ? (
            <MapIcon className="size-4" />
          ) : (
            <Satellite className="size-4" />
          )}
        </ControlButton>
      </div>
    </div>
  );
}
