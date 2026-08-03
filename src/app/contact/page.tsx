import ContactForm from "@/components/ContactForm";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("@/components/LocationMap"), {
  loading: () => (
    <div className="bg-muted/55 h-72 w-full animate-pulse rounded-md sm:h-[26rem]" />
  ),
});

export default function ContactPage() {
  return (
    <article className="page-shell">
      <header className="page-heading">
        <h1 className="title">contact me.</h1>
        <p className="page-lede">
          For collaborations, research inquiries, speaking opportunities, or
          just a hello — drop a message below or use the details listed here.
        </p>
      </header>

      {/* Same surface and padding as the form below, so the map's edges line
          up with the form fields instead of running 28px wider than them. */}
      <section className="contact-surface record-surface flex flex-col gap-3">
        <div className="map-frame">
          <LocationMap />
        </div>
        <p className="text-muted-foreground text-xs">
          Based in Roorkee, India. Share your location and the map draws the
          great circle between us and measures it.
        </p>
      </section>

      <ContactForm />
    </article>
  );
}
