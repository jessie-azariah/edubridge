import { NextResponse } from "next/server";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await ensureSeed();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
