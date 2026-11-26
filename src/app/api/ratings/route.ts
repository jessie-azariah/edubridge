import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ratings, resources } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to rate" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const resourceId = Number(body.resourceId);
  const rating = Number(body.rating);
  if (!Number.isInteger(resourceId) || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });

  const existing = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, me.id), eq(ratings.resourceId, resourceId)))
    .limit(1);

  if (existing.length) {
    await db
      .update(ratings)
      .set({ rating })
      .where(eq(ratings.id, existing[0].id));
  } else {
    await db.insert(ratings).values({ userId: me.id, resourceId, rating });
  }

  const [{ avg, count }] = await db
    .select({
      avg: sql<number>`coalesce(round(avg(${ratings.rating})::numeric, 1), 0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(ratings)
    .where(eq(ratings.resourceId, resourceId));

  await db
    .update(resources)
    .set({ avgRating: avg, ratingCount: count })
    .where(eq(resources.id, resourceId));

  return NextResponse.json({ avgRating: avg, ratingCount: count });
}
