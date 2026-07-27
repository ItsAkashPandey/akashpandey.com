import ContactForm from "@/components/ContactForm";

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

      <ContactForm />
    </article>
  );
}
