import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { resources, tips, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, decoded))
    .limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userResources = await db
    .select()
    .from(resources)
    .where(eq(resources.userId, user.id))
    .orderBy(desc(resources.createdAt))
    .limit(60);

  const [{ totalTips, tipCount }] = await db
    .select({
      totalTips: sql<number>`coalesce(sum(${tips.amount}),0)::int`,
      tipCount: sql<number>`count(*)::int`,
    })
    .from(tips)
    .where(eq(tips.toUserId, user.id));

  const { passwordHash, ...safe } = user;
  return NextResponse.json({
    user: safe,
    resources: userResources,
    totalTips: totalTips ?? 0,
    tipCount: tipCount ?? 0,
  });
}
