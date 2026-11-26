import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const resourceId = Number(body.resourceId);
  if (!Number.isInteger(resourceId))
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });

  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, me.id), eq(favorites.resourceId, resourceId)))
    .limit(1);

  let isFaved = false;
  if (existing.length) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, me.id), eq(favorites.resourceId, resourceId)));
  } else {
    await db.insert(favorites).values({ userId: me.id, resourceId });
    isFaved = true;
  }

  return NextResponse.json({ isFaved });
}
