import ContactForm from "@/components/ContactForm";
import MapLegend from "@/components/map/MapLegend";
import { buildMapData } from "@/lib/map/map-data";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("@/components/LocationMap"), {
  loading: () => (
    <div className="bg-muted/55 h-80 w-full animate-pulse rounded-md sm:h-[28rem]" />
  ),
});

export default function ContactPage() {
  return (
    <article className="page-shell">
      <header className="page-heading">
        <h1 className="title">contact me.</h1>
        <p className="page-lede">
          For collaborations, research questions, talks, or just a hello, drop a
          message below or email{" "}
          <a
            className="link-ink font-semibold"
            href="mailto:akash_k@ce.iitr.ac.in"
          >
            akash_k@ce.iitr.ac.in
          </a>
          .
        </p>
      </header>

      <ContactForm />

      {/* Same surface and padding as the form above, so the map's edges line
          up with the form fields. */}
      <section
        id="map"
        aria-labelledby="map-heading"
        className="contact-surface record-surface flex scroll-mt-20 flex-col gap-3"
      >
        <h2 id="map-heading" className="sr-only">
          Places on the map
        </h2>
        <div className="map-frame relative">
          <LocationMap data={buildMapData()} />
        </div>
        <MapLegend />
        <p className="text-muted-foreground text-xs">
          Based in Roorkee, India. Every place I have studied, worked or shown
          up for an activity is pinned. Share your location and the map draws
          the great circle between us.
        </p>
      </section>
    </article>
  );
}
