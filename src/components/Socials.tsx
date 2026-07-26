"use client";

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
import { toast } from "sonner";

const iconMap: Record<string, IconType> = {
  LinkedIn: FaLinkedinIn,
  GitHub: SiGithub,
  ORCID: SiOrcid,
  ResearchGate: SiResearchgate,
  "Google Scholar": SiGooglescholar,
  Email: HiOutlineEnvelope,
};

const brandStyles: Record<string, string> = {
  LinkedIn: "text-[#376d98] dark:text-[#7aa8cb]",
  GitHub: "text-[#414955] dark:text-[#c2c8d0]",
  ORCID: "text-[#718f39] dark:text-[#a6c86c]",
  ResearchGate: "text-[#2b897c] dark:text-[#75b8ad]",
  "Google Scholar": "text-[#526f9d] dark:text-[#8da7cf]",
  Email: "text-[#98685f] dark:text-[#c79a91]",
};

const socialClass =
  "group/social border-border/60 bg-card/65 hover:bg-card relative flex size-9 items-center justify-center rounded-sm border shadow-sm transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px";

export default function Socials({
  variant = "footer",
}: {
  variant?: "hero" | "footer";
}) {
  const socials = socialSchema
    .parse(data)
    .socials.filter(
      (item) =>
        variant !== "hero" ||
        (item.name !== "ORCID" && item.name !== "ResearchGate"),
    );

  const copyEmail = async () => {
    const address = "akash_k@ce.iitr.ac.in";
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Email copied", {
        description: address,
        duration: 1_800,
      });
    } catch {
      toast.error("Could not copy the email");
    }
  };

  return (
    <section className="flex flex-wrap gap-2.5" aria-label="Social profiles">
      {socials.map((item) => {
        const Icon = iconMap[item.name];
        const className = cn(
          socialClass,
          brandStyles[item.name] ?? "text-foreground",
        );

        if (item.name === "Email") {
          return (
            <button
              type="button"
              key={item.name}
              onClick={() => void copyEmail()}
              title="Copy email"
              aria-label="Copy email address"
              className={className}
            >
              {Icon && <Icon className="size-[17px]" aria-hidden />}
            </button>
          );
        }

        return (
          <a
            href={item.href}
            key={item.name}
            target="_blank"
            rel="noopener noreferrer"
            title={item.name}
            className={className}
          >
            {Icon && <Icon className="size-[17px]" aria-hidden />}
          </a>
        );
      })}
    </section>
  );
}
