import { Experience } from "@/lib/schemas";
import TimelineItem from "./TimelineItem";

interface Props {
  experience: Experience[];
}

export default function Timeline({ experience }: Props) {
  return (
    <ul className="timeline ml-4 sm:ml-5">
      {experience.map((exp, id) => (
        <TimelineItem key={id} experience={exp} />
      ))}
    </ul>
  );
}
