import { Images } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isGuestRole } from "@/lib/roles";
import { ensureDailyLogImagePhotos } from "@/lib/photo-sync";
import { PageHeader } from "@/components/page-header";
import { PhotoForm } from "@/components/forms/photo-form";
import { EmptyState } from "@/components/empty-state";
import { PhotoGallery } from "@/components/photo-gallery";
import { PetFilterForm } from "@/components/pet-filter-form";

export const metadata = { title: "成长相册" };

export default async function PhotosPage({ searchParams }: { searchParams: Promise<{ pet?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const { pet = "" } = await searchParams;
  const pets = await prisma.dog.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, species: true } });
  const petOptions = pets.map((item) => ({ id: item.id, name: item.name, species: item.species }));
  const selectedPetId = pets.some((item) => item.id === pet) ? pet : "";
  const dogWhere = selectedPetId ? { dogId: selectedPetId } : { dogId: { in: pets.map((item) => item.id) } };
  if (pets.length) await Promise.all(pets.map((item) => ensureDailyLogImagePhotos(item.id)));
  const [photos, logs] = pets.length ? await Promise.all([
    prisma.photo.findMany({
      where: dogWhere,
      include: { dog: { select: { name: true } }, dailyLog: { select: { title: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.dailyLog.findMany({
      where: dogWhere,
      select: { id: true, dogId: true, title: true, dog: { select: { name: true } } },
      orderBy: { occurredAt: "desc" },
      take: 30,
    }),
  ]) : [[], []];

  return <div className="page-enter">
    <PageHeader eyebrow="PHOTOS" title="成长相册" description="不必每张都完美，它们看向你的那一刻就已经值得收藏。" action={canWrite ? <PhotoForm pets={petOptions} logs={logs.map((log) => ({ id: log.id, dogId: log.dogId, title: selectedPetId ? log.title : `${log.dog.name} · ${log.title}` }))} disabled={!pets.length} /> : undefined} />
    {pets.length > 1 && <div className="mb-5 flex justify-end"><PetFilterForm action="/photos" value={selectedPetId} pets={petOptions} /></div>}
    {photos.length ? <>
      <div className="mb-5 flex items-center gap-3 rounded-3xl border bg-[var(--card)]/55 p-4 text-sm text-[var(--muted)] shadow-sm">
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><Images className="size-5" /></span>
        已收藏 <strong className="text-[var(--foreground)]">{photos.length}</strong> 张照片，最新的回忆排在前面。
      </div>
      <PhotoGallery canWrite={canWrite} photos={photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        title: photo.title,
        notes: photo.notes,
        date: photo.date.toISOString(),
        petName: photo.dog.name,
        dailyLogTitle: photo.dailyLog?.title || null,
      }))} />
    </> : <div className="soft-card rounded-3xl">
      <EmptyState title="第一张照片会是什么？" description="支持 JPG、PNG、WebP。上传后可以写下标题、日期，也可以关联一条日常记录。" action={canWrite ? <PhotoForm pets={petOptions} logs={logs.map((log) => ({ id: log.id, dogId: log.dogId, title: selectedPetId ? log.title : `${log.dog.name} · ${log.title}` }))} disabled={!pets.length} /> : undefined} />
    </div>}
  </div>;
}
