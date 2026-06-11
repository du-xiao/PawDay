import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

export async function saveImage(file: File) {
  if (!allowed.has(file.type)) throw new Error("仅支持 JPG、PNG、WebP 图片");
  if (file.size > 10 * 1024 * 1024) throw new Error("图片不能超过 10MB");
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomUUID()}.${allowed.get(file.type)}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
