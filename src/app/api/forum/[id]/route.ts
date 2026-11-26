import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { forumReplies, forumTopics, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topicId = Number(id);
  if (!Number.isInteger(topicId))
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 });

  const [topic] = await db
    .select()
    .from(forumTopics)
    .where(eq(forumTopics.id, topicId))
    .limit(1);
  if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [author] = await db
    .select()
    .from(users)
    .where(eq(users.id, topic.userId))
    .limit(1);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(forumReplies)
    .where(eq(forumReplies.topicId, topicId));

  return NextResponse.json({
    topic: {
      ...topic,
      author: author
        ? { username: author.username, fullName: author.fullName, role: author.role }
        : null,
    },
    replyCount: count ?? 0,
  });
}
