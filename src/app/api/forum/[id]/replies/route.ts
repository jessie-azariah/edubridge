import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { forumReplies, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topicId = Number(id);
  if (!Number.isInteger(topicId))
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 });

  const rows = await db
    .select({
      reply: forumReplies,
      author: { username: users.username, fullName: users.fullName, role: users.role },
    })
    .from(forumReplies)
    .leftJoin(users, eq(forumReplies.userId, users.id))
    .where(eq(forumReplies.topicId, topicId))
    .orderBy(desc(forumReplies.isAccepted), asc(forumReplies.createdAt))
    .limit(200);

  return NextResponse.json({
    replies: rows.map((r) => ({ ...r.reply, author: r.author })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topicId = Number(id);
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to reply" }, { status: 401 });
  if (!Number.isInteger(topicId))
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const content = String(body.content ?? "").trim();
  if (content.length < 2)
    return NextResponse.json({ error: "Reply is too short" }, { status: 400 });

  const [reply] = await db
    .insert(forumReplies)
    .values({ topicId, userId: me.id, content })
    .returning();

  return NextResponse.json({
    reply: { ...reply, author: { username: me.username, fullName: me.fullName, role: me.role } },
  });
}
