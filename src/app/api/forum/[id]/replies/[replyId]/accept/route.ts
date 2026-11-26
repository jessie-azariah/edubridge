import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { forumReplies, forumTopics } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> },
) {
  const { id, replyId } = await params;
  const topicId = Number(id);
  const replyIdNum = Number(replyId);
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!Number.isInteger(topicId) || !Number.isInteger(replyIdNum))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const [topic] = await db
    .select()
    .from(forumTopics)
    .where(eq(forumTopics.id, topicId))
    .limit(1);
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  if (topic.userId !== me.id)
    return NextResponse.json({ error: "Only the asker can accept an answer" }, { status: 403 });

  const [reply] = await db
    .select()
    .from(forumReplies)
    .where(eq(forumReplies.id, replyIdNum))
    .limit(1);
  if (!reply || reply.topicId !== topicId)
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });

  const newAccepted = !reply.isAccepted;
  await db
    .update(forumReplies)
    .set({ isAccepted: false })
    .where(eq(forumReplies.topicId, topicId));
  if (newAccepted) {
    await db
      .update(forumReplies)
      .set({ isAccepted: true })
      .where(eq(forumReplies.id, replyIdNum));
  }

  return NextResponse.json({ ok: true, isAccepted: newAccepted });
}
