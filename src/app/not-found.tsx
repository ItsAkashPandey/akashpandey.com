import LinkWithIcon from "@/components/LinkWithIcon";
import { ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
  return (
    <article className="page-shell">
      <section className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:py-20">
        <p className="title text-muted-foreground">404</p>
        <div className="border-border flex flex-col gap-3 sm:border-l sm:pl-6">
          <h1 className="title sm:text-5xl">page not found.</h1>
          <p className="text-muted-foreground max-w-prose text-base">
            The link may be old, or the page may have moved. Activities and
            papers have permanent addresses now, so the list pages are a good
            place to look.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkWithIcon
              href="/"
              text="home"
              icon={<ArrowLeftIcon className="size-4" />}
              position="left"
            />
            <LinkWithIcon href="/activities" text="activities" position="left" />
            <LinkWithIcon href="/publications" text="publications" position="left" />
          </div>
        </div>
      </section>
    </article>
  );
}
