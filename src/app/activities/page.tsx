import Activities from "@/components/Activities";

export default async function ActivitiesPage() {
    return (
        <article className="mt-8 flex flex-col gap-8 pb-16">
            <h1 className="title">my activities.</h1>

            <Activities />
        </article>
    );
}
