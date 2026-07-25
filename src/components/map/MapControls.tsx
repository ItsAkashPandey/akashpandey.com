import {
  Compass,
  LoaderCircle,
  LocateFixed,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react";

type MapControlsProps = {
  bearing: number;
  disabled: boolean;
  fullscreen: boolean;
  locateDisabled: boolean;
  locating: boolean;
  onFullscreen: () => void;
  onLocate: () => void;
  onResetNorth: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const buttonClass =
  "text-foreground hover:bg-accent focus-visible:ring-ring flex size-8 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

export default function MapControls({
  bearing,
  disabled,
  fullscreen,
  locateDisabled,
  locating,
  onFullscreen,
  onLocate,
  onResetNorth,
  onZoomIn,
  onZoomOut,
}: MapControlsProps) {
  return (
    <div
      role="group"
      aria-label="Map controls"
      className="bg-background/90 border-border/70 divide-border/65 absolute top-3 left-3 z-30 flex flex-col divide-y overflow-hidden rounded-lg border shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-md"
    >
      <button
        type="button"
        title="Zoom in"
        aria-label="Zoom in"
        disabled={disabled}
        onClick={onZoomIn}
        className={buttonClass}
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        title="Zoom out"
        aria-label="Zoom out"
        disabled={disabled}
        onClick={onZoomOut}
        className={buttonClass}
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        title="Reset north"
        aria-label="Reset north"
        disabled={disabled}
        onClick={onResetNorth}
        className={buttonClass}
      >
        <Compass
          className="size-4 transition-transform duration-200"
          style={{ transform: `rotate(${-bearing}deg)` }}
        />
      </button>
      <button
        type="button"
        title="Center on you"
        aria-label="Center on you"
        disabled={disabled || locateDisabled || locating}
        onClick={onLocate}
        className={buttonClass}
      >
        {locating ? (
          <LoaderCircle className="size-4 animate-spin text-sky-700 dark:text-sky-300" />
        ) : (
          <LocateFixed className="size-4 text-sky-700 dark:text-sky-300" />
        )}
      </button>
      <button
        type="button"
        title={fullscreen ? "Exit full screen" : "View full screen"}
        aria-label={fullscreen ? "Exit full screen" : "View full screen"}
        onClick={onFullscreen}
        className={buttonClass}
      >
        {fullscreen ? (
          <Minimize2 className="size-4" />
        ) : (
          <Maximize2 className="size-4" />
        )}
      </button>
    </div>
  );
}
