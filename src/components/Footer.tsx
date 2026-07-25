import Link from "next/link";
import Socials from "./Socials";

export default function Footer() {
  return (
    <footer className="w-full pt-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-5 pb-36 sm:flex-row-reverse sm:justify-between sm:px-8 lg:px-10">
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
            Updated 5 July 2026
          </p>
        </section>
      </div>
    </footer>
  );
}
