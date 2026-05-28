import { Experience } from "@/lib/schemas";
import TimelineItem from "./TimelineItem";
import { Card, CardContent } from "./ui/Card";

interface Props {
  experience: Experience[];
}

export default function Timeline({ experience }: Props) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-background/70 shadow-sm backdrop-blur-xl">
      <CardContent className="px-3 py-2 sm:px-6 sm:py-4">
        <ul className="ml-9 border-l sm:ml-12">
          {experience.map((exp, id) => (
            <TimelineItem key={id} experience={exp} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
