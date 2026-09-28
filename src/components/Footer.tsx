import Link from "next/link";
import CurrentYear from "./CurrentYear";
import Socials from "./Socials";

/** Set in next.config.mjs from the last commit's date. */
const LAST_UPDATED = process.env.SITE_LAST_UPDATED;

export default function Footer() {
  return (
    <footer className="site-footer relative z-10 mt-4 w-full pt-8">
      <div className="site-shell flex flex-col items-center justify-center gap-6 pb-10">
        <Socials />
        <section className="text-center">
          <p className="text-muted-foreground text-xs">
            &copy; <CurrentYear />{" "}
            <Link className="link" href="/">
              akashpandey.com
            </Link>{" "}
            |{" "}
            <Link className="link font-bold" href="/privacy">
              privacy
            </Link>
          </p>
          {LAST_UPDATED && (
            <p className="text-muted-foreground mt-1 text-[11px]">
              Updated{" "}
              <time dateTime={LAST_UPDATED}>
                {new Intl.DateTimeFormat("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${LAST_UPDATED}T00:00:00Z`))}
              </time>
            </p>
          )}
          <p className="text-muted-foreground mt-1.5 text-[11px]">
            <Link
              className="link"
              href="https://github.com/ItsAkashPandey/akashpandey.com"
              target="_blank"
              rel="noreferrer"
            >
              built with Next.js, Tailwind and a lot of tea
            </Link>
          </p>
        </section>
      </div>
    </footer>
  );
}
