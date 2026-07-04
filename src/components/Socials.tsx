import data from "@/data/socials.json";
import { socialSchema } from "@/lib/schemas";
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

const brandStyles: Record<string, string> = {
  LinkedIn:
    "text-[#376d98] dark:text-[#7aa8cb] [--brand:#376d98] dark:[--brand:#7aa8cb]",
  GitHub:
    "text-[#414955] dark:text-[#c2c8d0] [--brand:#414955] dark:[--brand:#c2c8d0]",
  ORCID:
    "text-[#718f39] dark:text-[#a6c86c] [--brand:#718f39] dark:[--brand:#a6c86c]",
  ResearchGate:
    "text-[#2b897c] dark:text-[#75b8ad] [--brand:#2b897c] dark:[--brand:#75b8ad]",
  "Google Scholar":
    "text-[#526f9d] dark:text-[#8da7cf] [--brand:#526f9d] dark:[--brand:#8da7cf]",
  Email:
    "text-[#98685f] dark:text-[#c79a91] [--brand:#98685f] dark:[--brand:#c79a91]",
};

export default function Socials() {
  const socials = socialSchema.parse(data).socials;

  return (
    <section className="flex flex-wrap gap-2" aria-label="Social profiles">
      {socials.map((item) => {
        const Icon = iconMap[item.name];
        return (
          <a
            href={item.href}
            key={item.name}
            target="_blank"
            className={`group/social border-border/55 bg-background/66 hover:border-border relative flex min-w-[52px] flex-col items-center gap-1.5 overflow-hidden rounded-[14px] border px-2 py-2 shadow-[0_5px_16px_rgba(15,23,42,.05),inset_0_1px_0_rgba(255,255,255,.55)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_color-mix(in_srgb,var(--brand)_16%,transparent)] ${brandStyles[item.name] ?? "text-foreground [--brand:#64748b]"}`}
            rel="noopener noreferrer"
            title={item.name}
          >
            <span className="border-border/45 bg-muted/38 relative z-10 grid size-8 place-items-center rounded-[11px] border shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition-transform duration-300 group-hover/social:scale-105">
              {Icon && <Icon className="size-4" aria-hidden />}
              <span className="pointer-events-none absolute inset-px rounded-[10px] bg-[radial-gradient(circle_at_70%_15%,rgba(255,255,255,.62),transparent_32%)] opacity-55 dark:opacity-18" />
            </span>
            <span className="text-muted-foreground group-hover/social:text-foreground relative z-10 max-w-[66px] truncate text-[9px] leading-tight font-medium transition-colors">
              {item.name}
            </span>
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 blur-[1px] transition-[left,opacity] duration-600 group-hover/social:left-[120%] group-hover/social:opacity-80 dark:via-white/20" />
          </a>
        );
      })}
    </section>
  );
}
