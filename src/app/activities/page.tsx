import Activities from "@/components/Activities";

export default async function ActivitiesPage() {
  return (
    <article className="page-shell">
      <header className="page-heading">
        <h1 className="title">my activities.</h1>
        <p className="page-lede">
          A visual timeline of fieldwork, research, workshops, startup
          milestones, and the people I have learned alongside.
        </p>
      </header>

      <Activities />
    </article>
  );
}
