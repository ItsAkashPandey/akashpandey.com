import Link from "next/link";
import siteData from "@/data/site.json";
import Socials from "./Socials";

export default function Footer() {
  return (
    <footer className="site-footer relative z-10 mt-4 w-full pt-8">
      <div className="site-shell flex flex-col items-center justify-center gap-6 pb-28 sm:pb-10">
        <Socials />
        <section className="text-center">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()}{" "}
            <Link className="link" href="/">
              akashpandey.com
            </Link>{" "}
            |{" "}
            <Link className="link font-bold" href="/privacy">
              privacy?
            </Link>
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Updated{" "}
            {new Intl.DateTimeFormat("en", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(`${siteData.lastUpdated}T00:00:00.000Z`))}
          </p>
          <p className="text-muted-foreground mt-1.5 text-[11px]">
            <Link
              className="link"
              href="https://github.com/ItsAkashPandey"
              target="_blank"
              rel="noreferrer"
            >
              built with Next.js, Tailwind and coffee
            </Link>
          </p>
        </section>
      </div>
    </footer>
  );
}
