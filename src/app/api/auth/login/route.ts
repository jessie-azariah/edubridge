import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const identifier = String(body.identifier ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!identifier || !password)
      return NextResponse.json({ error: "Enter your username/email and password" }, { status: 400 });

    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash))
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await createSession(user.id);
    await setSessionCookie(token);

    const { passwordHash, ...safe } = user;
    return NextResponse.json({ user: safe });
  } catch {
    return NextResponse.json({ error: "Could not log in" }, { status: 500 });
  }
}
