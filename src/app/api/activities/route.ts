import { NextResponse } from "next/server";
import data from "@/data/activities.json";
import { activitySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const offset = Math.max(Number(url.searchParams.get("offset") || "0"), 0);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") || "4"), 1),
    20,
  );

  let activities = activitySchema.parse(data).activities;
  activities = activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const batch = activities.slice(offset, offset + limit).map((activity) => ({
    ...activity,
    resolvedImages: activity.resolvedImages || [],
  }));

  return NextResponse.json(
    {
      activities: batch,
      total: activities.length,
      offset,
      limit,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}