import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { resources, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "text/plain",
  "text/markdown",
];
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() ?? "";
    const subject = sp.get("subject")?.trim() ?? "";
    const level = sp.get("level")?.trim() ?? "";
    const sort = sp.get("sort")?.trim() ?? "newest";
    const mine = sp.get("mine") === "1";
    const userId = sp.get("userId")?.trim() ?? "";

    const conditions = [eq(resources.status, "approved")];

    if (mine) {
      const me = await getCurrentUser();
      if (!me) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
      conditions.length = 0;
      conditions.push(eq(resources.userId, me.id));
    } else if (userId) {
      conditions.length = 0;
      conditions.push(eq(resources.userId, Number(userId)));
    }

    if (q)
      conditions.push(
        or(ilike(resources.title, `%${q}%`), ilike(resources.description, `%${q}%`))!,
      );
    if (subject) conditions.push(eq(resources.subject, subject));
    if (level) conditions.push(eq(resources.level, level));

    const orderBy =
      sort === "popular"
        ? desc(resources.downloads)
        : sort === "rating"
          ? desc(resources.avgRating)
          : desc(resources.createdAt);

    const rows = await db
      .select({
        resource: resources,
        uploader: { username: users.username, fullName: users.fullName, role: users.role },
      })
      .from(resources)
      .leftJoin(users, eq(resources.userId, users.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(100);

    return NextResponse.json({ resources: rows.map((r) => ({ ...r.resource, uploader: r.uploader })) });
  } catch {
    return NextResponse.json({ error: "Could not load resources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const level = String(form.get("level") ?? "").trim();

    if (!(file instanceof File))
      return NextResponse.json({ error: "Attach a file to upload" }, { status: 400 });
    if (title.length < 4)
      return NextResponse.json({ error: "Give your resource a clear title (min 4 chars)" }, { status: 400 });
    if (description.length < 10)
      return NextResponse.json({ error: "Add a short description (min 10 chars)" }, { status: 400 });
    if (!subject || !level)
      return NextResponse.json({ error: "Pick a subject and education level" }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, DOC, PPT, PNG, JPG or TXT." },
        { status: 415 },
      );
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: "File is larger than 15 MB" }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedFile(buffer, file.type, file.name);

    const [resource] = await db
      .insert(resources)
      .values({
        userId: me.id,
        title,
        description,
        subject,
        level,
        fileUrl: saved.fileUrl,
        fileName: saved.fileName,
        fileSize: saved.fileSize,
        fileType: file.type,
      })
      .returning();

    return NextResponse.json({ resource });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
