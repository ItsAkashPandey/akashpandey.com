import type { PublicationListItem } from "@/components/PublicationsWithSearch";
import { getPhoto } from "@/lib/photos";
import type { Publication } from "@/lib/schemas";

/** Attaches the pre-sized figures to a publication, for the client list. */
export function toPublicationListItem(
  publication: Publication,
): PublicationListItem {
  return {
    ...publication,
    media: (publication.media ?? []).map((item) => ({
      label: item.label,
      alt: item.alt,
      photo: getPhoto(item.image),
      full: getPhoto(item.fullImage ?? item.image),
    })),
  };
}
