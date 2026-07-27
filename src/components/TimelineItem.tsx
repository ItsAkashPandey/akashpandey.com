import { Experience } from "@/lib/schemas";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/Badge";
import Icon from "./Icon";

interface Props {
  experience: Experience;
}

export default function TimelineItem({ experience }: Props) {
  const { name, href, logo, logos, positions } = experience;
  const logoArray = logos || (logo ? [logo] : []);

  return (
    <li className="border-border/45 relative ml-4 border-b py-3 last:border-b-0 sm:ml-5 sm:py-3.5">
      <div className="absolute top-3 -left-[2.35rem] flex flex-col sm:-left-[2.7rem]">
        {logoArray.map((logoSrc, idx) => {
          return (
            <Link
              key={idx}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="border-border/70 flex size-9 items-center justify-center overflow-hidden rounded-full border bg-white p-1 shadow-sm transition-transform duration-200 hover:scale-[1.03] sm:size-10 dark:bg-slate-100"
            >
              <Image
                src={logoSrc}
                alt={name}
                width={44}
                height={44}
                className="size-full object-contain"
              />
            </Link>
          );
        })}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-start gap-1.5">
        <Link href={href} target="_blank" rel="noreferrer" className="w-fit">
                  <h2 className="text-[15px] leading-tight font-bold tracking-normal">
            {name}
          </h2>
        </Link>
        <div className="flex flex-col gap-1.5">
          {positions.map((position) => (
            <div key={`${position.title}-${position.start}`}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <p className="text-muted-foreground min-w-0 text-sm leading-tight font-semibold">
                  {position.title}
                </p>
                <time className="text-muted-foreground/90 border-border/60 border-l pl-2 text-[11px] tabular-nums">
                  <span>{position.start}</span>
                  <span>{" - "}</span>
                  <span>{position.end ?? "Present"}</span>
                </time>
              </div>
              {position.description && (
                <ul className="mt-1.5 ml-4 list-outside list-disc space-y-0.5">
                  {position.description.map((desc, i) => (
                    <li
                      key={i}
                    className="text-muted-foreground max-w-none pr-0 text-sm leading-snug sm:pr-2"
                    >
                      {desc}
                    </li>
                  ))}
                </ul>
              )}
              {position.links && position.links.length > 0 && (
                <div className="mt-2 flex flex-row flex-wrap items-start gap-2">
                  {position.links.map((link) => (
                    <Link href={link.href} key={link.href}>
                      <Badge title={link.name} className="flex gap-2">
                        <Icon
                          name={link.icon}
                          aria-hidden="true"
                          className="size-3"
                        />
                        {link.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}
