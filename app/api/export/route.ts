import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { auth } from "@/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import { normalizeRole, USER_ROLES } from "@/lib/roles";
import { uploadDir } from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TarEntry = { name: string; data: Buffer; mode?: number; mtime?: Date };

export async function GET() {
  await ensureDatabase();
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, disabledAt: true } });
  if (!user || user.disabledAt) return new Response("Unauthorized", { status: 401 });
  if (normalizeRole(user.role) !== USER_ROLES.OWNER) return new Response("Forbidden", { status: 403 });

  const dog = await prisma.dog.findFirst({
    include: {
      dailyLogs: { orderBy: { occurredAt: "desc" } },
      expenses: { orderBy: { date: "desc" } },
      health: { orderBy: { date: "desc" } },
      photos: { orderBy: { date: "desc" } },
      reminders: { orderBy: { dueAt: "asc" } },
      documents: { orderBy: { updatedAt: "desc" } },
    },
  });
  const exportedAt = new Date();
  const entries: TarEntry[] = [];
  const data = {
    exportedAt: exportedAt.toISOString(),
    app: "PawDay",
    schema: 2,
    dog,
  };

  entries.push(jsonEntry("manifest.json", {
    app: "PawDay",
    exportedAt: exportedAt.toISOString(),
    includes: ["data/pawday-data.json", "csv/*.csv", "uploads/*"],
    note: "这个导出包来自应用数据快照和上传目录文件，不需要直接读取 SQLite 热数据库文件。",
  }));
  entries.push(jsonEntry("data/pawday-data.json", data));
  entries.push(textEntry("csv/daily-logs.csv", csv([
    ["id", "type", "title", "occurredAt", "mood", "notes", "imageUrl"],
    ...(dog?.dailyLogs || []).map((item) => [item.id, item.type, item.title, item.occurredAt.toISOString(), item.mood || "", item.notes || "", item.imageUrl || ""]),
  ])));
  entries.push(textEntry("csv/health-records.csv", csv([
    ["id", "type", "title", "date", "weightKg", "nextReminderDate", "notes"],
    ...(dog?.health || []).map((item) => [item.id, item.type, item.title, item.date.toISOString(), item.weightGrams ? String(item.weightGrams / 1000) : "", item.nextReminderDate?.toISOString() || "", item.notes || ""]),
  ])));
  entries.push(textEntry("csv/expenses.csv", csv([
    ["id", "category", "amountCents", "date", "merchant", "notes"],
    ...(dog?.expenses || []).map((item) => [item.id, item.category, String(item.amountCents), item.date.toISOString(), item.merchant || "", item.notes || ""]),
  ])));
  entries.push(textEntry("csv/photos.csv", csv([
    ["id", "url", "title", "date", "dailyLogId", "notes"],
    ...(dog?.photos || []).map((item) => [item.id, item.url, item.title || "", item.date.toISOString(), item.dailyLogId || "", item.notes || ""]),
  ])));
  entries.push(textEntry("csv/reminders.csv", csv([
    ["id", "type", "title", "dueAt", "completed", "completedAt", "repeatInterval", "repeatUnit", "notes"],
    ...(dog?.reminders || []).map((item) => [item.id, item.type, item.title, item.dueAt.toISOString(), item.completed ? "true" : "false", item.completedAt?.toISOString() || "", item.repeatInterval ? String(item.repeatInterval) : "", item.repeatUnit || "", item.notes || ""]),
  ])));
  entries.push(textEntry("csv/documents.csv", csv([
    ["id", "type", "title", "identifier", "issuer", "issuedAt", "expiresAt", "frontImageUrl", "backImageUrl", "notes"],
    ...(dog?.documents || []).map((item) => [item.id, item.type, item.title || "", item.identifier || "", item.issuer || "", item.issuedAt?.toISOString() || "", item.expiresAt?.toISOString() || "", item.frontImageUrl || "", item.backImageUrl || "", item.notes || ""]),
  ])));

  for (const entry of await uploadEntries()) entries.push(entry);

  const archive = gzipSync(createTar(entries));
  const stamp = exportedAt.toISOString().slice(0, 10);
  return new Response(archive, {
    headers: {
      "content-type": "application/gzip",
      "content-disposition": `attachment; filename="pawday-export-${stamp}.tar.gz"`,
      "cache-control": "no-store",
    },
  });
}

async function uploadEntries() {
  const dir = uploadDir();
  try {
    const names = await readdir(dir);
    const entries: TarEntry[] = [];
    for (const name of names.sort()) {
      if (!name || name.startsWith(".") || name !== path.basename(name)) continue;
      const file = path.join(dir, name);
      const info = await stat(file);
      if (!info.isFile()) continue;
      entries.push({ name: `uploads/${name}`, data: await readFile(file), mode: 0o644, mtime: info.mtime });
    }
    return entries;
  } catch {
    return [];
  }
}

function jsonEntry(name: string, value: unknown): TarEntry {
  return textEntry(name, `${JSON.stringify(value, null, 2)}\n`);
}

function textEntry(name: string, value: string): TarEntry {
  return { name, data: Buffer.from(value, "utf8"), mode: 0o644 };
}

function csv(rows: string[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function csvCell(value: string) {
  const escaped = value.replaceAll("\"", "\"\"");
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function createTar(entries: TarEntry[]) {
  const chunks: Buffer[] = [];
  for (const entry of entries) {
    chunks.push(tarHeader(entry));
    chunks.push(entry.data);
    const padding = (512 - (entry.data.length % 512)) % 512;
    if (padding) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  return Buffer.concat(chunks);
}

function tarHeader(entry: TarEntry) {
  const header = Buffer.alloc(512);
  const name = Buffer.from(entry.name);
  if (name.length > 100) throw new Error(`导出文件名过长：${entry.name}`);
  name.copy(header, 0);
  writeOctal(header, entry.mode ?? 0o644, 100, 8);
  writeOctal(header, 0, 108, 8);
  writeOctal(header, 0, 116, 8);
  writeOctal(header, entry.data.length, 124, 12);
  writeOctal(header, Math.floor((entry.mtime ?? new Date()).getTime() / 1000), 136, 12);
  header.fill(0x20, 148, 156);
  header[156] = "0".charCodeAt(0);
  Buffer.from("ustar\0", "ascii").copy(header, 257);
  Buffer.from("00", "ascii").copy(header, 263);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  writeOctal(header, checksum, 148, 8);
  return header;
}

function writeOctal(buffer: Buffer, value: number, offset: number, length: number) {
  const text = value.toString(8).padStart(length - 1, "0").slice(-(length - 1));
  buffer.write(text, offset, length - 1, "ascii");
  buffer[offset + length - 1] = 0;
}
