import { LoaderCircle, Map as MapIcon, Satellite, Waypoints } from "lucide-react";

type MapControlsProps = {
  disabled: boolean;
  imagery: boolean;
  locateDisabled: boolean;
  locating: boolean;
  onLocate: () => void;
  onToggleImagery: () => void;
};

const buttonClass =
  "text-foreground hover:bg-accent focus-visible:ring-ring flex size-8 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

export default function MapControls({
  disabled,
  imagery,
  locateDisabled,
  locating,
  onLocate,
  onToggleImagery,
}: MapControlsProps) {
  return (
    <div
      role="group"
      aria-label="Map controls"
      className="bg-background/90 border-border/70 divide-border/65 absolute top-3 left-3 z-30 flex flex-col divide-y overflow-hidden rounded-lg border shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-md"
    >
      <button
        type="button"
        title="Show the distance between you and Akash"
        aria-label="Show the distance between you and Akash"
        disabled={disabled || locateDisabled || locating}
        onClick={onLocate}
        className={buttonClass}
      >
        {locating ? (
          <LoaderCircle className="size-4 animate-spin text-[#1f5457] dark:text-[#9adcd5]" />
        ) : (
          <Waypoints className="size-4 text-[#1f5457] dark:text-[#9adcd5]" />
        )}
      </button>
      <button
        type="button"
        title={imagery ? "Switch to the vector map" : "Switch to satellite imagery"}
        aria-label={
          imagery ? "Switch to the vector map" : "Switch to satellite imagery"
        }
        aria-pressed={imagery}
        disabled={disabled}
        onClick={onToggleImagery}
        className={buttonClass}
      >
        {imagery ? (
          <MapIcon className="size-4" />
        ) : (
          <Satellite className="size-4" />
        )}
      </button>
    </div>
  );
}
