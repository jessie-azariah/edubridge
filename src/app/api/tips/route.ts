import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tips, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to send a tip" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const toUserId = Number(body.toUserId);
  const amount = Number(body.amount);
  const network = body.network === "airtel" ? "airtel" : "mtn";
  const message = String(body.message ?? "").trim().slice(0, 280);

  if (!Number.isInteger(toUserId))
    return NextResponse.json({ error: "Invalid educator" }, { status: 400 });
  if (!Number.isFinite(amount) || amount < 500 || amount > 1_000_000)
    return NextResponse.json({ error: "Enter an amount between UGX 500 and 1,000,000" }, { status: 400 });

  const [toUser] = await db.select().from(users).where(eq(users.id, toUserId)).limit(1);
  if (!toUser) return NextResponse.json({ error: "Educator not found" }, { status: 404 });
  if (toUser.role !== "educator")
    return NextResponse.json({ error: "You can only tip educators" }, { status: 400 });

  const [tip] = await db
    .insert(tips)
    .values({
      fromUserId: me.id,
      toUserId,
      amount,
      network,
      message,
    })
    .returning();

  // running total for the educator profile
  const [{ total }] = await db
    .select({ total: tips.amount })
    .from(tips)
    .where(eq(tips.toUserId, toUserId));

  return NextResponse.json({ tip, totalTipped: total ?? 0 });
}
