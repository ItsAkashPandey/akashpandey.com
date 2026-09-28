import data from "@/data/socials.json";
import { socialSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { IconType } from "react-icons";
import { FaLinkedinIn } from "react-icons/fa6";
import { HiOutlineEnvelope } from "react-icons/hi2";
import {
  SiGithub,
  SiGooglescholar,
  SiOrcid,
  SiResearchgate,
} from "react-icons/si";

const iconMap: Record<string, IconType> = {
  LinkedIn: FaLinkedinIn,
  GitHub: SiGithub,
  ORCID: SiOrcid,
  ResearchGate: SiResearchgate,
  "Google Scholar": SiGooglescholar,
  Email: HiOutlineEnvelope,
};

/**
 * Each service keeps its own (muted) brand colour in both themes, which is
 * why these are fixed values rather than theme variables.
 */
const brandStyles: Record<string, string> = {
  LinkedIn: "text-[#376d98] dark:text-[#7aa8cb]",
  GitHub: "text-[#414955] dark:text-[#c2c8d0]",
  ORCID: "text-[#718f39] dark:text-[#a6c86c]",
  ResearchGate: "text-[#2b897c] dark:text-[#75b8ad]",
  "Google Scholar": "text-[#526f9d] dark:text-[#8da7cf]",
  Email: "text-[#98685f] dark:text-[#c79a91]",
};

const socialClass =
  "border-border/60 bg-card/72 hover:bg-card focus-visible:ring-ring relative flex size-9 items-center justify-center rounded-md border shadow-sm transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:outline-none";

export default function Socials() {
  const { socials } = socialSchema.parse(data);

  return (
    <ul className="flex flex-wrap justify-center gap-2.5" aria-label="Profiles">
      {socials.map((item) => {
        const Icon = iconMap[item.name];
        const isEmail = item.href.startsWith("mailto:");
        const label = isEmail
          ? `Email ${item.href.replace("mailto:", "")}`
          : item.name;

        return (
          <li key={item.name}>
            <a
              href={item.href}
              {...(isEmail
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={label}
              title={label}
              className={cn(
                socialClass,
                brandStyles[item.name] ?? "text-foreground",
              )}
            >
              {Icon && <Icon className="size-[17px]" aria-hidden />}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
