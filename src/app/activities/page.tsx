import Activities from "@/components/Activities";

export default async function ActivitiesPage() {
  return (
    <article className="mt-10 flex flex-col gap-8 pb-16">
      <header className="max-w-3xl space-y-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
          Field notes · research · building
        </p>
        <h1 className="title">my activities.</h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">
          A visual timeline of fieldwork, research, workshops, startup
          milestones, and the people I have learned alongside.
        </p>
      </header>

      <Activities />
    </article>
  );
}
