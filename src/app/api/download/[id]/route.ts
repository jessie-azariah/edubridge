import { promises as fs } from "fs";
import path from "path";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";

export const dynamic = "force-dynamic";

const TYPE_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId))
    return new Response("Not found", { status: 404 });

  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);
  if (!resource) return new Response("Not found", { status: 404 });

  // increment download count
  await db
    .update(resources)
    .set({ downloads: sql`${resources.downloads} + 1` })
    .where(eq(resources.id, resourceId));

  const filePath = path.join(process.cwd(), "public", resource.fileUrl);
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(resource.fileName) || path.extname(resource.fileUrl);
    const contentType = TYPE_MAP[ext.toLowerCase()] ?? "application/octet-stream";
    const encoded = encodeURIComponent(resource.fileName || `resource-${resourceId}`);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}
