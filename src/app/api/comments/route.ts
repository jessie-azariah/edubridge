import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resourceId = Number(req.nextUrl.searchParams.get("resourceId"));
  if (!Number.isInteger(resourceId))
    return NextResponse.json({ error: "Missing resourceId" }, { status: 400 });

  const rows = await db
    .select({
      comment: comments,
      author: { username: users.username, fullName: users.fullName, role: users.role },
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.resourceId, resourceId))
    .orderBy(desc(comments.createdAt))
    .limit(100);

  return NextResponse.json({ comments: rows.map((r) => ({ ...r.comment, author: r.author })) });
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const resourceId = Number(body.resourceId);
  const content = String(body.content ?? "").trim();
  if (!Number.isInteger(resourceId))
    return NextResponse.json({ error: "Missing resourceId" }, { status: 400 });
  if (content.length < 2)
    return NextResponse.json({ error: "Comment is too short" }, { status: 400 });

  const [comment] = await db
    .insert(comments)
    .values({ resourceId, userId: me.id, content })
    .returning();

  return NextResponse.json({
    comment: { ...comment, author: { username: me.username, fullName: me.fullName, role: me.role } },
  });
}
