import { Experience } from "@/lib/schemas";
import TimelineItem from "./TimelineItem";

interface Props {
  experience: Experience[];
}

export default function Timeline({ experience }: Props) {
  return (
    <ul className="border-border/65 ml-4 border-l sm:ml-5">
      {experience.map((exp, id) => (
        <TimelineItem key={id} experience={exp} />
      ))}
    </ul>
  );
}
