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
              "group/social border-border/55 bg-background/60 hover:border-border relative flex size-9 items-center justify-center overflow-hidden rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_8px_20px_color-mix(in_srgb,var(--brand)_20%,transparent)]",
              brandStyles[item.name] ?? "text-foreground [--brand:#64748b]"
            )}
          >
            {/* Background light gradient */}
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(255,255,255,0.15),transparent_45%)] dark:bg-[radial-gradient(circle_at_70%_15%,rgba(255,255,255,0.05),transparent_45%)]" />

            {/* Icon */}
            {Icon && (
              <Icon
                className="size-[17px] transition-transform duration-300 group-hover/social:scale-110"
                aria-hidden
              />
            )}

            {/* Crystal shine animation / White light sweep */}
            <span className="pointer-events-none absolute inset-0 -skew-x-20 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover/social:translate-x-[150%] dark:via-white/12" />
          </a>
        );
      })}
    </section>
  );
}
