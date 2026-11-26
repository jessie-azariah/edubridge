import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const username = String(body.username ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");
    const role = body.role === "educator" ? "educator" : "student";
    const school = String(body.school ?? "").trim();

    if (username.length < 3)
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    if (fullName.length < 2)
      return NextResponse.json({ error: "Please enter your full name" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (existing.length)
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });

    const existingEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingEmail.length)
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const [user] = await db
      .insert(users)
      .values({
        username,
        email,
        fullName,
        passwordHash: hashPassword(password),
        role,
        school,
      })
      .returning();

    const token = await createSession(user.id);
    await setSessionCookie(token);

    const { passwordHash, ...safe } = user;
    return NextResponse.json({ user: safe });
  } catch {
    return NextResponse.json({ error: "Could not register" }, { status: 500 });
  }
}
