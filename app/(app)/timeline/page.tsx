import Image from "next/image";
import Link from "next/link";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowLeft, ArrowRight, ArrowUpRight, BellRing, CalendarDays, Camera, CircleDollarSign, HeartPulse, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { imageVariantUrl } from "@/lib/image-variants";
import { cn, formatDateTime, money } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { TypeIcon } from "@/components/type-icon";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "成长回顾" };

const kindOrder = [
  { value: "log", label: "日常" },
  { value: "health", label: "健康" },
  { value: "expense", label: "开销" },
  { value: "photo", label: "照片" },
  { value: "reminder", label: "提醒" },
] as const;

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

type EventKind = typeof kindOrder[number]["value"];

type TimelineItem = {
  id: string;
  kind: EventKind;
  type: string;
  title: string;
  date: Date;
  detail: string;
  notes?: string | null;
  imageUrl?: string | null;
  href: string;
};

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const selectedMonth = normalizeMonth(params.month);
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthKey = format(monthStart, "yyyy-MM");
  const dog = await prisma.dog.findFirst();

  const [logs, health, expenses, photos, reminders] = dog ? await Promise.all([
    prisma.dailyLog.findMany({
      where: { dogId: dog.id, occurredAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { occurredAt: "desc" },
      select: { id: true, type: true, title: true, notes: true, occurredAt: true, mood: true, imageUrl: true },
    }),
    prisma.healthRecord.findMany({
      where: { dogId: dog.id, date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
      select: { id: true, type: true, title: true, date: true, notes: true, weightGrams: true, nextReminderDate: true },
    }),
    prisma.expense.findMany({
      where: { dogId: dog.id, date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
      select: { id: true, category: true, itemName: true, amountCents: true, date: true, merchant: true, notes: true },
    }),
    prisma.photo.findMany({
      where: { dogId: dog.id, date: { gte: monthStart, lte: monthEnd } },
      include: { dailyLog: { select: { title: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.reminder.findMany({
      where: { dogId: dog.id, dueAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { dueAt: "asc" },
      select: { id: true, type: true, title: true, dueAt: true, completed: true, repeatInterval: true, repeatUnit: true, notes: true },
    }),
  ]) : [[], [], [], [], []];

  const allItems: TimelineItem[] = [
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
      title: item.itemName || item.merchant || item.category,
      date: item.date,
      detail: `${item.category} · ${money(item.amountCents)}${item.merchant && item.merchant !== item.itemName ? ` · ${item.merchant}` : ""}`,
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
    ...reminders.map((item) => ({
      id: `reminder-${item.id}`,
      kind: "reminder" as const,
      type: item.type,
      title: item.title,
      date: item.dueAt,
      detail: `${item.completed ? "已完成" : "待处理"}${item.repeatInterval && item.repeatUnit ? ` · 每 ${item.repeatInterval} ${item.repeatUnit}` : ""}`,
      notes: item.notes?.startsWith("health:") ? null : item.notes,
      href: "/reminders",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const items = allItems;
  const dayGroups = items.reduce<Record<string, TimelineItem[]>>((acc, item) => {
    const key = format(item.date, "yyyy-MM-dd");
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
  const calendarDays = buildCalendarDays(monthStart, monthEnd);
  const counts = countKinds(items);
  const photoHighlight = photos[0];
  const largestExpense = [...expenses].sort((a, b) => b.amountCents - a.amountCents)[0];
  const latestHealth = health[0];
  const latestItem = items[0];
  const activeDayCount = Object.keys(dayGroups).length;
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amountCents, 0);

  return (
    <div className="page-enter space-y-5 sm:space-y-8">
      <PageHeader eyebrow="TIMELINE" title="成长回顾" description="默认汇总全部记录，用月份把日常、照片、健康、开销和提醒整理成一张清晰回顾。" />

      <section className="overflow-hidden rounded-2xl border bg-[var(--card)]/72 shadow-sm shadow-stone-900/[.025] sm:rounded-3xl">
        <div className="flex flex-col gap-3 p-3.5 sm:gap-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--orange-soft)] text-[var(--orange)] sm:size-11 sm:rounded-2xl"><CalendarDays className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{format(monthStart, "yyyy年M月", { locale: zhCN })}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                {activeDayCount ? `${activeDayCount} 天留下记录，累计 ${items.length} 件事` : "这个月还没有记录"}
              </p>
              {latestItem && (
                <p className="mt-2 line-clamp-1 text-xs text-[var(--muted)]">
                  最近更新：{kindLabel(latestItem.kind)} · {latestItem.title}
                </p>
              )}
            </div>
          </div>
          <MonthNav month={monthKey} />
        </div>
      </section>

      {!dog ? (
        <div className="soft-card rounded-2xl sm:rounded-3xl">
          <EmptyState title="先创建小狗档案" description="有了档案后，成长回顾才会开始记录。" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Sparkles} label="本月事件" value={`${allItems.length} 件`} meta={`${counts.log} 条日常 · ${counts.photo} 张照片`} tone="orange" />
            <Metric icon={HeartPulse} label="健康与提醒" value={`${counts.health + counts.reminder} 件`} meta={`${counts.health} 条健康 · ${counts.reminder} 个提醒`} tone="sage" />
            <Metric icon={CircleDollarSign} label="本月开销" value={money(expenseTotal)} meta={`${counts.expense} 笔记录`} tone="violet" />
            <Metric icon={Camera} label="照片回忆" value={`${counts.photo} 张`} meta={photoHighlight ? format(photoHighlight.date, "M月d日", { locale: zhCN }) : "等待第一张照片"} tone="pink" />
          </section>

          <section className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-semibold">月历</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">所有事件按日期铺开，颜色表示记录类型。</p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-[var(--muted)]">
                  {kindOrder.map((item) => (
                    <span key={item.value} className="inline-flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", kindDot(item.value))} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekdays.map((day) => <div key={day} className="px-1 text-center text-[11px] font-semibold text-[var(--muted)] sm:text-xs">{day}</div>)}
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  return <CalendarCell key={key} day={day} currentMonth={monthStart} items={dayGroups[key] || []} />;
                })}
              </div>
            </div>

            <aside className="space-y-3 sm:space-y-4">
              <h2 className="font-semibold">本月亮点</h2>
              {photoHighlight ? <HighlightPhoto photo={{ url: photoHighlight.url, title: photoHighlight.title || photoHighlight.dailyLog?.title || "照片回忆", date: photoHighlight.date }} /> : <HighlightEmpty />}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <HighlightLine icon={HeartPulse} label="最近健康" value={latestHealth ? latestHealth.title : "暂无健康记录"} meta={latestHealth ? `${latestHealth.type} · ${format(latestHealth.date, "M月d日", { locale: zhCN })}` : "本月未记录"} tone="sage" href="/health" />
                <HighlightLine icon={CircleDollarSign} label="最大开销" value={largestExpense ? money(largestExpense.amountCents) : "暂无开销"} meta={largestExpense ? `${largestExpense.itemName || largestExpense.merchant || largestExpense.category} · ${format(largestExpense.date, "M月d日", { locale: zhCN })}` : "本月未记录"} tone="violet" href="/expenses" />
              </div>
            </aside>
          </section>

          {items.length ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">日子回放</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">{items.length} 件回顾按日期收拢，展开每天发生过的重点。</p>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(dayGroups).map(([day, dayItems]) => <DayRecap key={day} day={day} items={dayItems} />)}
              </div>
            </section>
          ) : (
            <div className="soft-card rounded-2xl sm:rounded-3xl">
              <EmptyState title="这个月还没有记录" description="日常、照片、健康、开销或提醒都会出现在这里。" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function normalizeMonth(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return startOfMonth(new Date());
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? startOfMonth(new Date()) : startOfMonth(date);
}

function buildCalendarDays(monthStart: Date, monthEnd: Date) {
  const days: Date[] = [];
  let day = startOfWeek(monthStart, { weekStartsOn: 1 });
  const last = endOfWeek(monthEnd, { weekStartsOn: 1 });
  while (day <= last) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

function countKinds(items: TimelineItem[]) {
  return items.reduce<Record<EventKind, number>>((acc, item) => {
    acc[item.kind] += 1;
    return acc;
  }, { log: 0, health: 0, expense: 0, photo: 0, reminder: 0 });
}

function MonthNav({ month }: { month: string }) {
  const current = new Date(`${month}-01T00:00:00`);
  return (
    <div className="flex w-full items-center justify-between rounded-xl bg-black/[.035] p-1 dark:bg-white/[.055] sm:w-auto sm:rounded-2xl">
      <Button asChild variant="ghost" size="icon" aria-label="上个月"><Link href={timelineHref(format(addMonths(current, -1), "yyyy-MM"))}><ArrowLeft className="size-4" /></Link></Button>
      <Button asChild variant="ghost" size="sm" className="px-4"><Link href={timelineHref(format(new Date(), "yyyy-MM"))}>本月</Link></Button>
      <Button asChild variant="ghost" size="icon" aria-label="下个月"><Link href={timelineHref(format(addMonths(current, 1), "yyyy-MM"))}><ArrowRight className="size-4" /></Link></Button>
    </div>
  );
}

function CalendarCell({ day, currentMonth, items }: { day: Date; currentMonth: Date; items: TimelineItem[] }) {
  const inMonth = isSameMonth(day, currentMonth);
  const isCurrentDay = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const preview = items.slice(0, 4);
  return (
    <div className={cn(
      "min-h-12 overflow-hidden rounded-xl border bg-[var(--card)]/58 p-1.5 shadow-sm shadow-stone-900/[.015] sm:min-h-[6.75rem] sm:rounded-2xl sm:p-2.5",
      !inMonth && "opacity-35",
      items.length && "border-orange-300/35 bg-[var(--card)] shadow-md shadow-orange-900/[.03]",
      isCurrentDay && inMonth && "ring-2 ring-[var(--orange)]/20",
    )}>
      <div className="flex items-center justify-between gap-1">
        <span className={cn("text-xs font-semibold tabular-nums", !inMonth && "text-[var(--muted)]")}>{format(day, "d")}</span>
        {items.length > 4 && <span className="rounded-full bg-black/[.045] px-1.5 py-0.5 text-[10px] leading-none text-[var(--muted)] dark:bg-white/[.06]">+{items.length - 4}</span>}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2 sm:block sm:space-y-1">
        {preview.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", kindDot(item.kind))} />
          <span className="hidden min-w-0 truncate text-[10px] text-[var(--muted)] sm:block">{item.title}</span>
        </div>)}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, meta, tone }: { icon: typeof Sparkles; label: string; value: string; meta: string; tone: "orange" | "sage" | "violet" | "pink" }) {
  const tones = {
    orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    pink: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  };
  return (
    <div className="soft-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5">
      <div className={cn("grid size-9 place-items-center rounded-xl sm:size-10 sm:rounded-2xl", tones[tone])}><Icon className="size-4 sm:size-5" /></div>
      <p className="mt-4 text-xs text-[var(--muted)] sm:mt-5">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-xl">{value}</p>
      <p className="mt-1 truncate text-xs text-[var(--muted)]">{meta}</p>
    </div>
  );
}

function HighlightPhoto({ photo }: { photo: { url: string; title: string; date: Date } }) {
  return (
    <Link href="/photos" className="group block overflow-hidden rounded-2xl border bg-[var(--card)] shadow-sm shadow-stone-900/[.025] transition hover:-translate-y-0.5 hover:shadow-xl sm:rounded-3xl">
      <div className="relative aspect-[4/3]">
        <Image src={imageVariantUrl(photo.url, "medium")} alt={photo.title} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.035]" sizes="(max-width: 1280px) 100vw, 380px" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-12 text-white sm:p-4 sm:pt-16">
          <p className="text-xs text-white/70">{format(photo.date, "M月d日", { locale: zhCN })}</p>
          <p className="mt-1 line-clamp-2 font-semibold">{photo.title}</p>
        </div>
      </div>
    </Link>
  );
}

function HighlightEmpty() {
  return (
    <div className="rounded-2xl border bg-[var(--card)]/60 p-4 sm:rounded-3xl sm:p-5">
      <div className="grid aspect-[4/3] place-items-center rounded-xl bg-black/[.025] text-center sm:rounded-2xl dark:bg-white/[.035]">
        <div>
          <Camera className="mx-auto size-6 text-[var(--orange)]" />
          <p className="mt-3 text-sm font-semibold">暂无照片亮点</p>
          <p className="mt-1 text-xs text-[var(--muted)]">本月照片会出现在这里</p>
        </div>
      </div>
    </div>
  );
}

function HighlightLine({ icon: Icon, label, value, meta, tone, href }: { icon: typeof HeartPulse; label: string; value: string; meta: string; tone: "sage" | "violet"; href: string }) {
  const tones = {
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  };
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3 rounded-2xl border bg-[var(--card)]/72 p-3.5 shadow-sm shadow-stone-900/[.025] transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl sm:p-4">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 sm:rounded-2xl", tones[tone])}><Icon className="size-4 sm:size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-[var(--muted)]">{label}</span>
        <span className="mt-0.5 block truncate font-semibold">{value}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{meta}</span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-[var(--muted)]" />
    </Link>
  );
}

function DayRecap({ day, items }: { day: string; items: TimelineItem[] }) {
  const photoItems = items.filter((item): item is TimelineItem & { imageUrl: string } => Boolean(item.imageUrl));
  return (
    <section className="grid gap-2 rounded-2xl border bg-[var(--card)]/62 p-2.5 shadow-sm shadow-stone-900/[.02] sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3 sm:rounded-3xl sm:p-5 lg:grid-cols-[9rem_minmax(0,1fr)]">
      <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{format(new Date(`${day}T00:00:00`), "M月d日", { locale: zhCN })}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{format(new Date(`${day}T00:00:00`), "EEEE", { locale: zhCN })} · {items.length} 件事</p>
        </div>
        <div className="flex max-w-[56%] flex-wrap justify-end gap-1.5 sm:mt-3 sm:max-w-none sm:justify-start">
          {[...new Set(items.map((item) => item.kind))].map((kind) => <Badge key={kind} className={kindBadge(kind)}>{kindLabel(kind)}</Badge>)}
        </div>
      </div>
      <div className={cn("grid gap-3", photoItems.length && "lg:grid-cols-[minmax(0,1fr)_minmax(220px,240px)] lg:items-start")}>
        <div className="space-y-2">
          {items.map((item) => <EventRow key={item.id} item={item} />)}
        </div>
        {photoItems.length > 0 && <DayPhotoPreview photos={photoItems} />}
      </div>
    </section>
  );
}

function DayPhotoPreview({ photos }: { photos: Array<TimelineItem & { imageUrl: string }> }) {
  const mainPhoto = photos[0];
  const extraPhotos = photos.slice(1, 3);
  const hiddenCount = Math.max(photos.length - 3, 0);
  return (
    <div className="hidden lg:block">
      <Link href={mainPhoto.href} className="group/photo relative block aspect-[4/3] overflow-hidden rounded-2xl border bg-black/[.05] shadow-sm shadow-stone-900/[.025]">
        <Image src={imageVariantUrl(mainPhoto.imageUrl, "medium")} alt={mainPhoto.title} fill unoptimized className="object-cover transition duration-500 group-hover/photo:scale-[1.035]" sizes="240px" />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 to-transparent p-3 pt-12 text-white">
          <span className="block line-clamp-1 text-xs font-semibold">{mainPhoto.title}</span>
        </span>
      </Link>
      {extraPhotos.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {extraPhotos.map((photo, index) => (
            <Link key={photo.id} href={photo.href} className="relative aspect-square overflow-hidden rounded-xl bg-black/[.05]">
              <Image src={imageVariantUrl(photo.imageUrl, "thumb")} alt={photo.title} fill unoptimized className="object-cover" sizes="112px" />
              {index === extraPhotos.length - 1 && hiddenCount > 0 && (
                <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-semibold text-white">+{hiddenCount}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ item }: { item: TimelineItem }) {
  return (
    <Link href={item.href} className="group flex min-w-0 items-start gap-2.5 rounded-xl p-2 transition hover:bg-black/[.025] dark:hover:bg-white/[.04] sm:gap-3 sm:rounded-2xl sm:p-2.5">
      {item.kind === "photo" || item.kind === "reminder" ? (
        <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl", kindIconTone(item.kind))}>{item.kind === "photo" ? <Camera className="size-4" /> : <BellRing className="size-4" />}</span>
      ) : (
        <TypeIcon kind={item.kind === "log" ? "log" : item.kind === "health" ? "health" : "expense"} type={item.type} size="sm" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
          <Badge className={cn("shrink-0", kindBadge(item.kind))}>{kindLabel(item.kind)}</Badge>
        </span>
        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{formatDateTime(item.date)} · {item.detail}</span>
        {item.notes && (
          <span className="mt-1 line-clamp-3 block whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--muted)] [overflow-wrap:anywhere] sm:line-clamp-2">
            {item.notes}
          </span>
        )}
      </span>
      <ArrowUpRight className="mt-1 size-4 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--foreground)]" />
    </Link>
  );
}

function timelineHref(month: string) {
  const search = new URLSearchParams({ month });
  return `/timeline?${search.toString()}`;
}

function kindLabel(kind: EventKind) {
  if (kind === "log") return "日常";
  if (kind === "health") return "健康";
  if (kind === "expense") return "开销";
  if (kind === "photo") return "照片";
  return "提醒";
}

function kindDot(kind: EventKind) {
  if (kind === "log") return "bg-[var(--orange)]";
  if (kind === "health") return "bg-[var(--sage)]";
  if (kind === "expense") return "bg-violet-500";
  if (kind === "photo") return "bg-pink-500";
  return "bg-sky-500";
}

function kindBadge(kind: EventKind) {
  if (kind === "log") return "bg-[var(--orange-soft)] text-[#9a5838] dark:text-[#ffc19d]";
  if (kind === "health") return "bg-[var(--sage-soft)] text-[#5f775f] dark:text-[#bdd8bb]";
  if (kind === "expense") return "bg-violet-500/10 text-violet-700 dark:text-violet-300";
  if (kind === "photo") return "bg-pink-500/10 text-pink-700 dark:text-pink-300";
  return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

function kindIconTone(kind: "photo" | "reminder") {
  return kind === "photo" ? "bg-pink-500/10 text-pink-700 dark:text-pink-300" : "bg-sky-500/10 text-sky-700 dark:text-sky-300";
}
