import data from "@/data/socials.json";
import { socialSchema } from "@/lib/schemas";
import type { IconType } from "react-icons";
import { FaLinkedinIn } from "react-icons/fa6";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { cn } from "@/lib/utils";
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

const brandStyles: Record<string, string> = {
  LinkedIn:
    "text-[#376d98] dark:text-[#7aa8cb] [--brand:#376d98] dark:[--brand:#7aa8cb] hover:border-[#376d98]/30 dark:hover:border-[#7aa8cb]/30",
  GitHub:
    "text-[#414955] dark:text-[#c2c8d0] [--brand:#414955] dark:[--brand:#c2c8d0] hover:border-[#414955]/30 dark:hover:border-[#c2c8d0]/30",
  ORCID:
    "text-[#718f39] dark:text-[#a6c86c] [--brand:#718f39] dark:[--brand:#a6c86c] hover:border-[#718f39]/30 dark:hover:border-[#a6c86c]/30",
  ResearchGate:
    "text-[#2b897c] dark:text-[#75b8ad] [--brand:#2b897c] dark:[--brand:#75b8ad] hover:border-[#2b897c]/30 dark:hover:border-[#75b8ad]/30",
  "Google Scholar":
    "text-[#526f9d] dark:text-[#8da7cf] [--brand:#526f9d] dark:[--brand:#8da7cf] hover:border-[#526f9d]/30 dark:hover:border-[#8da7cf]/30",
  Email:
    "text-[#98685f] dark:text-[#c79a91] [--brand:#98685f] dark:[--brand:#c79a91] hover:border-[#98685f]/30 dark:hover:border-[#c79a91]/30",
};

export default function Socials() {
  const socials = socialSchema.parse(data).socials;

  return (
    <section className="flex flex-wrap gap-2.5" aria-label="Social profiles">
      {socials.map((item) => {
        const Icon = iconMap[item.name];
        return (
          <a
            href={item.href}
            key={item.name}
            target="_blank"
            rel="noopener noreferrer"
            title={item.name}
            className={cn(
              "group/social border-border/60 bg-card/65 hover:bg-card relative flex size-9 items-center justify-center rounded-md border shadow-sm transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px",
              brandStyles[item.name] ?? "text-foreground [--brand:#64748b]",
            )}
          >
            {Icon && <Icon className="size-[17px]" aria-hidden />}
          </a>
        );
      })}
    </section>
  );
}
