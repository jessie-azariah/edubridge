import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "text/plain": ".txt",
  "text/markdown": ".md",
};

export function extensionFor(fileType: string, originalName: string): string {
  if (EXT_BY_TYPE[fileType]) return EXT_BY_TYPE[fileType];
  const ext = path.extname(originalName);
  return ext || ".bin";
}

export async function saveUploadedFile(
  buffer: Buffer,
  fileType: string,
  originalName: string,
): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  await ensureUploadDir();
  const ext = extensionFor(fileType, originalName);
  const fileName = `${randomUUID()}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, fileName);
  await fs.writeFile(fullPath, buffer);
  return {
    fileUrl: `/uploads/${fileName}`,
    fileName: originalName || fileName,
    fileSize: buffer.length,
  };
}

export async function writeSampleFile(
  fileName: string,
  content: string,
): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  await ensureUploadDir();
  const fullPath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(content, "utf8");
  await fs.writeFile(fullPath, buffer);
  return {
    fileUrl: `/uploads/${fileName}`,
    fileName,
    fileSize: buffer.length,
  };
}
