import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites, ratings, resources, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId))
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });

  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [uploader] = await db
    .select()
    .from(users)
    .where(eq(users.id, resource.userId))
    .limit(1);

  const me = await getCurrentUser();
  let isFaved = false;
  let myRating = 0;
  if (me) {
    const [f] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, me.id), eq(favorites.resourceId, resourceId)))
      .limit(1);
    isFaved = !!f;
    const [r] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, me.id), eq(ratings.resourceId, resourceId)))
      .limit(1);
    myRating = r?.rating ?? 0;
  }

  return NextResponse.json({
    resource: {
      ...resource,
      uploader: uploader
        ? {
            id: uploader.id,
            username: uploader.username,
            fullName: uploader.fullName,
            role: uploader.role,
            school: uploader.school,
          }
        : null,
    },
    isFaved,
    myRating,
  });
}
