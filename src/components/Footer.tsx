import Link from "next/link";
import siteData from "@/data/site.json";
import Socials from "./Socials";

export default function Footer() {
  return (
    <footer className="site-footer relative z-10 mt-4 w-full pt-8">
      <div className="site-shell flex flex-col items-center justify-center pb-32 sm:flex-row-reverse sm:justify-between sm:pb-10">
        <Socials />
        <section className="mt-8 text-center sm:mt-0 sm:text-left">
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
          <p className="text-muted-foreground/70 mt-1 text-[10px]">
            Updated{" "}
            {new Intl.DateTimeFormat("en", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(`${siteData.lastUpdated}T00:00:00.000Z`))}
          </p>
        </section>
      </div>
    </footer>
  );
}
