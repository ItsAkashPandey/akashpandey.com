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
      <div className="absolute top-4 -left-[3.5rem] flex flex-col sm:top-5 sm:-left-[4.5rem]">
        {logoArray.map((logoSrc, idx) => {
          return (
            <Link
              key={idx}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex size-14 items-center justify-center rounded-full border bg-white shadow-sm transition-transform duration-300 hover:scale-105 sm:size-16"
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
              <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_max-content] sm:items-baseline sm:gap-x-4">
                <p className="text-muted-foreground min-w-0 text-sm leading-tight font-semibold">
                  {position.title}
                </p>
                <time className="text-muted-foreground/80 bg-muted/45 justify-self-start rounded-full px-2 py-0.5 text-xs tabular-nums sm:justify-self-end">
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
