import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { forumReplies, forumTopics, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const subject = sp.get("subject")?.trim() ?? "";
  const level = sp.get("level")?.trim() ?? "";

  const conditions: SQL[] = [];
  if (q)
    conditions.push(
      or(ilike(forumTopics.title, `%${q}%`), ilike(forumTopics.body, `%${q}%`))!,
    );
  if (subject) conditions.push(eq(forumTopics.subject, subject));
  if (level) conditions.push(eq(forumTopics.level, level));

  const rows = await db
    .select({
      topic: forumTopics,
      author: { username: users.username, fullName: users.fullName, role: users.role },
    })
    .from(forumTopics)
    .leftJoin(users, eq(forumTopics.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(forumTopics.createdAt))
    .limit(100);

  const replyRows = await db
    .select({ topicId: forumReplies.topicId, id: forumReplies.id })
    .from(forumReplies);
  const countMap = new Map<number, number>();
  for (const r of replyRows) countMap.set(r.topicId, (countMap.get(r.topicId) ?? 0) + 1);

  return NextResponse.json({
    topics: rows.map((r) => ({
      ...r.topic,
      author: r.author,
      replyCount: countMap.get(r.topic.id) ?? 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to post" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const title = String(body.title ?? "").trim();
  const bodyText = String(body.body ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const level = String(body.level ?? "general").trim();

  if (title.length < 6)
    return NextResponse.json({ error: "Give your question a clear title (min 6 chars)" }, { status: 400 });
  if (bodyText.length < 10)
    return NextResponse.json({ error: "Add more detail to your question" }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "Pick a subject" }, { status: 400 });

  const [topic] = await db
    .insert(forumTopics)
    .values({ userId: me.id, title, body: bodyText, subject, level })
    .returning();

  return NextResponse.json({ topic });
}
