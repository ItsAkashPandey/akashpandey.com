import { Experience } from "@/lib/schemas";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import Icon from "./Icon";

interface Props {
  experience: Experience;
}

export default function TimelineItem({ experience }: Props) {
  const { name, href, logo, logos, positions } = experience;
  const logoArray = logos || (logo ? [logo] : []);

  return (
    <li className="relative ml-5 py-4 sm:ml-7 sm:py-5">
      <div className="absolute top-3 -left-[3.5rem] flex flex-col sm:top-4 sm:-left-[4.25rem]">
        {logoArray.map((logoSrc, idx) => {
          return (
            <Link
              key={idx}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="border-border/70 flex size-14 items-center justify-center rounded-full border bg-white shadow-sm transition-transform duration-200 hover:scale-[1.03] sm:size-16 dark:bg-slate-100"
            >
              <Avatar className="size-14 rounded-full border sm:size-16">
                <AvatarImage
                  src={logoSrc}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  className="bg-background object-contain"
                />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
            </Link>
          );
        })}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-start gap-2">
        <Link href={href} target="_blank" rel="noreferrer" className="w-fit">
          <h2 className="text-base leading-tight font-bold tracking-normal sm:text-lg">
            {name}
          </h2>
        </Link>
        <div className="flex flex-col gap-2">
          {positions.map((position) => (
            <div key={`${position.title}-${position.start}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-muted-foreground min-w-0 text-sm leading-tight font-semibold">
                  {position.title}
                </p>
                <time className="text-muted-foreground/90 bg-muted/55 rounded-md px-2 py-0.5 text-xs tabular-nums">
                  <span>{position.start}</span>
                  <span>{" - "}</span>
                  <span>{position.end ?? "Present"}</span>
                </time>
              </div>
              {position.description && (
                <ul className="mt-2 ml-4 list-outside list-disc space-y-1">
                  {position.description.map((desc, i) => (
                    <li
                      key={i}
                      className="text-muted-foreground max-w-none pr-0 text-sm leading-relaxed sm:pr-2"
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
