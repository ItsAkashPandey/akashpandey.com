import { LoaderCircle, Waypoints } from "lucide-react";

type MapControlsProps = {
  disabled: boolean;
  locateDisabled: boolean;
  locating: boolean;
  onLocate: () => void;
};

const buttonClass =
  "text-foreground hover:bg-accent focus-visible:ring-ring flex size-8 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

export default function MapControls({
  disabled,
  locateDisabled,
  locating,
  onLocate,
}: MapControlsProps) {
  return (
    <div
      role="group"
      aria-label="Map controls"
      className="bg-background/90 border-border/70 absolute top-3 left-3 z-30 flex flex-col overflow-hidden rounded-lg border shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-md"
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
    </div>
  );
}
