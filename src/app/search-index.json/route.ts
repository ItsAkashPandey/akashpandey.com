import { buildSearchIndex } from "@/lib/search-index";

// Built once at deploy time, like the pages it points to.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex());
}
