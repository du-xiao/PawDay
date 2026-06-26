import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type DailyLogImage = {
  id: string;
  dogId: string;
  title: string;
  notes: string | null;
  occurredAt: Date;
  imageUrl: string | null;
};

export async function syncDailyLogImagePhoto(tx: Prisma.TransactionClient, log: DailyLogImage, previousImageUrl?: string | null) {
  if (!log.imageUrl) return;

  const data = {
    dogId: log.dogId,
    dailyLogId: log.id,
    url: log.imageUrl,
    title: log.title || null,
    notes: log.notes,
    date: log.occurredAt,
  };
  const existing = await tx.photo.findFirst({ where: { dailyLogId: log.id, url: log.imageUrl } });

  if (existing) {
    await tx.photo.update({ where: { id: existing.id }, data });
    return;
  }

  if (previousImageUrl) {
    const previous = await tx.photo.findFirst({ where: { dailyLogId: log.id, url: previousImageUrl } });
    if (previous) {
      await tx.photo.update({ where: { id: previous.id }, data });
      return;
    }
  }

  await tx.photo.create({ data });
}

export async function ensureDailyLogImagePhotos(dogId: string) {
  const logs = await prisma.dailyLog.findMany({
    where: { dogId, imageUrl: { not: null } },
    select: { id: true, dogId: true, title: true, notes: true, occurredAt: true, imageUrl: true },
  });
  if (!logs.length) return;

  const existing = await prisma.photo.findMany({
    where: { dogId, dailyLogId: { in: logs.map((log) => log.id) } },
    select: { dailyLogId: true, url: true },
  });
  const existingKeys = new Set(existing.map((photo) => `${photo.dailyLogId}:${photo.url}`));
  const missing = logs.filter((log) => log.imageUrl && !existingKeys.has(`${log.id}:${log.imageUrl}`));
  if (!missing.length) return;

  await prisma.photo.createMany({
    data: missing.map((log) => ({
      dogId: log.dogId,
      dailyLogId: log.id,
      url: log.imageUrl as string,
      title: log.title || null,
      notes: log.notes,
      date: log.occurredAt,
    })),
  });
}
