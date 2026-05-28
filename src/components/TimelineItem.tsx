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
    <li className="relative ml-5 py-5 sm:ml-8 sm:py-6">
      <div className="absolute -left-[3.1rem] top-5 flex flex-col sm:-left-[4rem] sm:top-6">
        {logoArray.map((logoSrc, idx) => {
          return (
            <Link
              key={idx}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex size-11 items-center justify-center rounded-full border bg-white shadow-sm transition-transform duration-300 hover:scale-105 sm:size-12"
            >
              <Avatar className="size-11 rounded-full border sm:size-12">
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
          <h2 className="text-base font-semibold leading-tight tracking-normal">{name}</h2>
        </Link>
        <div className="flex flex-col gap-2">
          {positions.map((position) => (
            <div key={`${position.title}-${position.start}`}>
              <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_max-content] sm:items-baseline sm:gap-x-4">
                <p className="min-w-0 text-sm font-medium leading-tight text-muted-foreground">
                  {position.title}
                </p>
                <time className="justify-self-start rounded-full bg-muted/45 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground/80 sm:justify-self-end sm:text-xs">
                  <span>{position.start}</span>
                  <span>{" - "}</span>
                  <span>{position.end ?? "Present"}</span>
                </time>
              </div>
              {position.description && (
                <ul className="ml-4 mt-2 list-outside list-disc space-y-1">
                  {position.description.map((desc, i) => (
                    <li
                      key={i}
                      className="prose max-w-none pr-0 text-sm leading-relaxed text-muted-foreground dark:prose-invert sm:pr-2"
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
