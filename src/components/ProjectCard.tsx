import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Activity as Project } from "@/lib/schemas";
import Link from "next/link";
import Markdown from "react-markdown";
import Icon from "./Icon";
import SwipeCards from "./SwipeCards";

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  const { name, href, description, image, images, tags, links } = project;

  // Combine all available images for the swipe cards
  const allImages = images?.length ? images : image ? [image] : [];

  return (
    <Card className="flex flex-col">
      {allImages.length > 0 && (
        <div className="flex justify-center py-4">
          <SwipeCards images={allImages} className="w-full max-w-[280px]" />
        </div>
      )}
      <CardContent className="flex flex-col gap-2">
        <CardTitle>{name}</CardTitle>
        <div className="prose text-muted-foreground dark:prose-invert max-w-full font-sans text-xs text-pretty">
          <Markdown>{description}</Markdown>
        </div>
      </CardContent>
      <CardFooter className="flex h-full flex-col items-start justify-between gap-4">
        {links && links.length > 0 && (
          <div className="flex flex-row flex-wrap items-start gap-1">
            {links.toSorted().map((link: any, idx: number) => (
              <Link
                href={link?.href}
                key={idx}
                target="_blank"
                rel="noreferrer"
              >
                <Badge key={idx} className="flex gap-2 px-2 py-1 text-[10px]">
                  <Icon name={link.icon} className="size-3" />
                  {link.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
