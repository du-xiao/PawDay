"use client";

import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Link2, X } from "lucide-react";
import { deletePhotoAction } from "@/actions/app";
import { DeleteButton } from "@/components/forms/shared";
import { formatDate } from "@/lib/utils";

type Photo = {
  id: string;
  url: string;
  title: string | null;
  notes: string | null;
  date: string;
  dailyLogTitle: string | null;
};

export function PhotoGallery({ photos, canWrite = true }: { photos: Photo[]; canWrite?: boolean }) {
  const [active, setActive] = useState<Photo | null>(null);
  const groups = photos.reduce<{ key: string; label: string; photos: Photo[] }[]>((acc, photo) => {
    const key = formatDate(photo.date, "yyyy-MM");
    const group = acc.find((item) => item.key === key);
    if (group) group.photos.push(photo);
    else acc.push({ key, label: formatDate(photo.date, "yyyy年M月"), photos: [photo] });
    return acc;
  }, []);

  return <>
    <div className="space-y-9">
      {groups.map((group) => <section key={group.key}>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-[-.03em]">{group.label}</h2>
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span className="text-xs text-[var(--muted)]">{group.photos.length} 张</span>
        </div>
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
          {group.photos.map((photo, index) => <button key={photo.id} onClick={() => setActive(photo)} className="group relative mb-3 block w-full overflow-hidden rounded-3xl bg-black/[.05] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white/[.04]">
            <Image src={photo.url} alt={photo.title || "小狗照片"} width={600} height={index % 3 === 0 ? 760 : 520} priority={group.key === groups[0]?.key && index < 2} unoptimized className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white opacity-0 transition group-hover:opacity-100">
              <span className="block text-sm font-medium">{photo.title || formatDate(photo.date, "M月d日")}</span>
            </span>
          </button>)}
        </div>
      </section>)}
    </div>

    {active && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 backdrop-blur-md" onClick={() => setActive(null)}>
      <button className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" onClick={() => setActive(null)}><X className="size-5" /><span className="sr-only">关闭</span></button>
      <div className="grid max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-[var(--background)] shadow-2xl lg:grid-cols-[minmax(0,1fr)_320px]" onClick={(event) => event.stopPropagation()}>
        <div className="relative min-h-[50vh] bg-black lg:min-h-[70vh]"><Image src={active.url} alt={active.title || "小狗照片"} fill unoptimized className="object-contain" sizes="80vw" /></div>
        <aside className="flex max-h-[42vh] flex-col overflow-y-auto p-6 lg:max-h-none">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--orange)]">MEMORY</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">{active.title || "这一天的瞬间"}</h2>
          <div className="mt-5 flex items-center gap-2 text-sm text-[var(--muted)]"><CalendarDays className="size-4" />{formatDate(active.date)}</div>
          {active.dailyLogTitle && <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]"><Link2 className="size-4" />{active.dailyLogTitle}</div>}
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">{active.notes || "没有备注，照片已经说了很多。"}</p>
          {canWrite && <div className="mt-auto pt-8"><DeleteButton action={() => deletePhotoAction(active.id)} label="删除照片" onDeleted={() => setActive(null)} /></div>}
        </aside>
      </div>
    </div>, document.body)}
  </>;
}
