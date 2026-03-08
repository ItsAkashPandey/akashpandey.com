import data from "@/data/socials.json";
import { socialSchema } from "@/lib/schemas";
import Icon from "./Icon";

export default function Socials() {
  const socials = socialSchema.parse(data).socials;

  return (
    <section className="flex gap-6">
      {socials.map((item) => (
        <a
          href={item.href}
          key={item.name}
          target="_blank"
          className="group relative overflow-hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          rel="noopener noreferrer"
          title={item.name}
        >
          <span className="sr-only">{item.name}</span>
          <Icon name={item.icon} aria-hidden="true" className="relative z-10 size-5" />
          {/* Glass shine effect */}
          <span 
            className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover:animate-[shine_0.6s_ease-in-out]"
            style={{
              background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
            }}
          />
        </a>
      ))}
    </section>
  );
}
