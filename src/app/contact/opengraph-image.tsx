import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Contact Dr. Akash Kumar";

export default async function Image() {
  return renderOgImage({
    kicker: "Contact",
    title: "Get in touch",
    subtitle:
      "Research collaborations, talks, fieldwork or just a hello. Based in Roorkee, India.",
    photo: "/img/akash-2.webp",
  });
}
