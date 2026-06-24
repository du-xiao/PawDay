import { Images } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PhotoForm } from "@/components/forms/photo-form";
import { EmptyState } from "@/components/empty-state";
import { PhotoGallery } from "@/components/photo-gallery";

export const metadata = { title: "成长相册" };

export default async function PhotosPage() {
  const dog = await prisma.dog.findFirst();
  const [photos, logs] = dog ? await Promise.all([
    prisma.photo.findMany({
      where: { dogId: dog.id },
      include: { dailyLog: { select: { title: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.dailyLog.findMany({
      where: { dogId: dog.id },
      select: { id: true, title: true },
      orderBy: { occurredAt: "desc" },
      take: 30,
    }),
  ]) : [[], []];

  return <div className="page-enter">
    <PageHeader eyebrow="PHOTOS" title="成长相册" description="不必每张都完美，它看向你的那一刻就已经值得收藏。" action={<PhotoForm logs={logs} disabled={!dog} />} />
    {photos.length ? <>
      <div className="mb-5 flex items-center gap-3 rounded-3xl border bg-[var(--card)]/55 p-4 text-sm text-[var(--muted)] shadow-sm">
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><Images className="size-5" /></span>
        已收藏 <strong className="text-[var(--foreground)]">{photos.length}</strong> 张照片，最新的回忆排在前面。
      </div>
      <PhotoGallery photos={photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        title: photo.title,
        notes: photo.notes,
        date: photo.date.toISOString(),
        dailyLogTitle: photo.dailyLog?.title || null,
      }))} />
    </> : <div className="soft-card rounded-3xl">
      <EmptyState title="第一张照片会是什么？" description="支持 JPG、PNG、WebP。上传后可以写下标题、日期，也可以关联一条日常记录。" action={<PhotoForm logs={logs} disabled={!dog} />} />
    </div>}
  </div>;
}
