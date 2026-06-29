import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import { uploadDir } from "@/lib/upload";

const mime: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    await ensureDatabase();
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { disabledAt: true } });
    if (!user || user.disabledAt) return new NextResponse("Unauthorized", { status: 401 });

    const parts = (await params).path;
    const root = uploadDir();
    const file = path.resolve(root, ...parts);
    if (!file.startsWith(`${root}${path.sep}`)) return new NextResponse("Not found", { status: 404 });
    const ext = path.extname(file).toLowerCase();
    if (!mime[ext]) return new NextResponse("Not found", { status: 404 });
    const data = await readFile(file);
    return new NextResponse(data, {
      headers: {
        "Content-Type": mime[ext],
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
