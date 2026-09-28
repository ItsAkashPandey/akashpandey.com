import type { IconName } from "@/lib/icon-names";
import {
  Book,
  CircleUserRound,
  FileText,
  FlaskConical,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  Youtube,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * A fixed map instead of lucide's dynamic import table: the data only ever
 * uses these ten, and importing them directly renders on the server with no
 * loading placeholder and no loader for the other thousand icons.
 */
const ICONS = {
  book: Book,
  "circle-user-round": CircleUserRound,
  "file-text": FileText,
  "flask-conical": FlaskConical,
  github: Github,
  globe: Globe,
  "graduation-cap": GraduationCap,
  linkedin: Linkedin,
  mail: Mail,
  youtube: Youtube,
} satisfies Record<IconName, LucideIcon>;

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
}

export default function Icon({ name, ...props }: IconProps) {
  const LucideIcon = ICONS[name];
  return <LucideIcon aria-hidden {...props} />;
}
