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
    <li className="relative ml-6 sm:ml-10 py-4">
      <div className="absolute -left-12 sm:-left-16 top-4 flex flex-col">
        {logoArray.map((logoSrc, idx) => {
          return (
            <Link
              key={idx}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center border bg-white rounded-full size-12"
            >
              <Avatar className="size-12 border rounded-full">
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
      <div className="flex flex-1 flex-col justify-start gap-2">
        <Link href={href} target="_blank" rel="noreferrer" className="w-fit">
          <h2 className="text-base font-semibold leading-none">{name}</h2>
        </Link>
        <div className="flex flex-col gap-2">
          {positions.map((position) => (
            <div key={`${position.title}-${position.start}`}>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-x-4">
                <p className="text-sm font-medium leading-tight text-muted-foreground">
                  {position.title}
                </p>
                <time className="whitespace-nowrap text-[10px] sm:text-xs tabular-nums text-muted-foreground/80">
                  <span>{position.start}</span>
                  <span>{" - "}</span>
                  <span>{position.end ?? "Present"}</span>
                </time>
              </div>
              {position.description && (
                <ul className="ml-4 mt-2 list-outside list-disc">
                  {position.description.map((desc, i) => (
                    <li
                      key={i}
                      className="prose pr-8 text-sm dark:prose-invert"
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
