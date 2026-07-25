import { Experience } from "@/lib/schemas";
import TimelineItem from "./TimelineItem";
import { Card, CardContent } from "./ui/Card";

interface Props {
  experience: Experience[];
}

export default function Timeline({ experience }: Props) {
  return (
    <Card className="record-surface border-border/65 overflow-hidden rounded-lg">
      <CardContent className="px-3 py-2 sm:px-5 sm:py-3">
        <ul className="ml-9 border-l sm:ml-11">
          {experience.map((exp, id) => (
            <TimelineItem key={id} experience={exp} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
