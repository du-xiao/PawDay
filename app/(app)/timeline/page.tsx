import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowUpRight, Camera, CircleDollarSign, HeartPulse, NotebookPen, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { imageVariantUrl } from "@/lib/image-variants";
import { formatDateTime, money } from "@/lib/utils";
import { isGuestRole } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { TypeIcon } from "@/components/type-icon";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "成长时间线" };

const kinds = [
  { value: "", label: "全部" },
  { value: "log", label: "日常" },
  { value: "health", label: "健康" },
  { value: "expense", label: "开销" },
  { value: "photo", label: "照片" },
] as const;

type TimelineItem = {
  id: string;
  kind: "log" | "health" | "expense" | "photo";
  type: string;
  title: string;
  date: Date;
  detail: string;
  notes?: string | null;
  imageUrl?: string | null;
  href: string;
};

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const params = await searchParams;
  const selectedKind = kinds.some((item) => item.value === params.kind) ? params.kind || "" : "";
  const dog = await prisma.dog.findFirst();
  const [logs, health, expenses, photos] = dog ? await Promise.all([
    selectedKind && selectedKind !== "log" ? [] : prisma.dailyLog.findMany({ where: { dogId: dog.id }, orderBy: { occurredAt: "desc" }, take: 80 }),
    selectedKind && selectedKind !== "health" ? [] : prisma.healthRecord.findMany({ where: { dogId: dog.id }, orderBy: { date: "desc" }, take: 80 }),
    selectedKind && selectedKind !== "expense" ? [] : prisma.expense.findMany({ where: { dogId: dog.id }, orderBy: { date: "desc" }, take: 80 }),
    selectedKind && selectedKind !== "photo" ? [] : prisma.photo.findMany({ where: { dogId: dog.id }, include: { dailyLog: { select: { title: true } } }, orderBy: { date: "desc" }, take: 80 }),
  ]) : [[], [], [], []];

  const items: TimelineItem[] = [
    ...logs.map((item) => ({
      id: `log-${item.id}`,
      kind: "log" as const,
      type: item.type,
      title: item.title,
      date: item.occurredAt,
      detail: `${item.type}${item.mood ? ` · ${item.mood}` : ""}`,
      notes: item.notes,
      imageUrl: item.imageUrl,
      href: "/logs",
    })),
    ...health.map((item) => ({
      id: `health-${item.id}`,
      kind: "health" as const,
      type: item.type,
      title: item.title,
      date: item.date,
      detail: `${item.type}${item.weightGrams ? ` · ${(item.weightGrams / 1000).toFixed(2)} kg` : ""}${item.nextReminderDate ? " · 已设提醒" : ""}`,
      notes: item.notes,
      href: "/health",
    })),
    ...expenses.map((item) => ({
      id: `expense-${item.id}`,
      kind: "expense" as const,
      type: item.category,
      title: item.merchant || item.category,
      date: item.date,
      detail: `${item.category} · ${money(item.amountCents)}`,
      notes: item.notes,
      href: "/expenses",
    })),
    ...photos.map((item) => ({
      id: `photo-${item.id}`,
      kind: "photo" as const,
      type: "照片",
      title: item.title || item.dailyLog?.title || "一张照片",
      date: item.date,
      detail: item.dailyLog?.title ? `关联：${item.dailyLog.title}` : "成长相册",
      notes: item.notes,
      imageUrl: item.url,
      href: "/photos",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 160);

  const groups = items.reduce<Record<string, TimelineItem[]>>((acc, item) => {
    const key = format(item.date, "yyyy-MM-dd");
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="page-enter">
      <PageHeader eyebrow="TIMELINE" title="成长时间线" description="把日常、健康、开销和照片按时间串起来，回看时就像翻一本生活账本。" />

      <section className="mb-6 flex flex-col gap-4 rounded-3xl border bg-[var(--card)]/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><Sparkles className="size-5" /></span>
          最近最多展示 160 条事件，最新的排在前面。
        </div>
        <KindTabs selectedKind={selectedKind} />
      </section>

      {!dog ? (
        <div className="soft-card rounded-3xl">
          <EmptyState title="先创建小狗档案" description="有了档案后，时间线才会开始记录。" />
        </div>
      ) : items.length ? (
        <div className="space-y-8">
          {Object.entries(groups).map(([day, dayItems]) => (
            <section key={day}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-semibold">{format(new Date(`${day}T00:00:00`), "M月d日 EEEE", { locale: zhCN })}</span>
                <span className="h-px flex-1 bg-[var(--line)]" />
                <span className="text-xs text-[var(--muted)]">{dayItems.length} 件事</span>
              </div>
              <div className="space-y-3">
                {dayItems.map((item) => <TimelineCard key={item.id} item={item} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="soft-card rounded-3xl">
          <EmptyState title={selectedKind ? "这个类型还没有记录" : "时间线还是空的"} description={selectedKind ? "换一个类型或选择全部后再看看。" : "从一条日常、一张照片或一次称重开始，时间线就会慢慢长起来。"} />
        </div>
      )}

      {canWrite && <p className="mt-6 text-center text-xs text-[var(--muted)]">新增记录可以使用右下角的快速入口。</p>}
    </div>
  );
}

function KindTabs({ selectedKind }: { selectedKind: string }) {
  return (
    <div className="grid grid-cols-5 rounded-2xl bg-black/[.035] p-1 text-xs font-semibold dark:bg-white/[.055]">
      {kinds.map((item) => {
        const active = selectedKind === item.value;
        return <Link key={item.value || "all"} href={item.value ? `/timeline?kind=${item.value}` : "/timeline"} className={`rounded-xl px-3 py-2 text-center transition ${active ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>{item.label}</Link>;
      })}
    </div>
  );
}

function TimelineCard({ item }: { item: TimelineItem }) {
  const Icon = item.kind === "photo" ? Camera : item.kind === "health" ? HeartPulse : item.kind === "expense" ? CircleDollarSign : NotebookPen;
  return (
    <article className="soft-card rounded-3xl p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        {item.kind === "photo" ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-pink-500/10 text-pink-700 ring-1 ring-inset ring-pink-500/10 dark:text-pink-300"><Icon className="size-5" /></span>
        ) : (
          <TypeIcon kind={item.kind === "log" ? "log" : item.kind === "health" ? "health" : "expense"} type={item.type} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{item.title}</h3>
                <Badge>{kindLabel(item.kind)}</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(item.date)} · {item.detail}</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href={item.href}>查看<ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </div>
          {item.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">{item.notes}</p>}
          {item.imageUrl && <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl sm:max-w-sm">
            <Image src={imageVariantUrl(item.imageUrl, "medium")} alt={item.title} fill unoptimized className="object-cover" sizes="(max-width: 640px) 100vw, 384px" />
          </div>}
        </div>
      </div>
    </article>
  );
}

function kindLabel(kind: TimelineItem["kind"]) {
  if (kind === "log") return "日常";
  if (kind === "health") return "健康";
  if (kind === "expense") return "开销";
  return "照片";
}
