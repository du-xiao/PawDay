import Link from "next/link";
import { Activity, CalendarClock, Filter, HeartPulse, Scale, ShieldPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { deleteHealthAction } from "@/actions/app";
import { cn, formatDate, toDateInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { HealthForm } from "@/components/forms/health-form";
import { DeleteButton } from "@/components/forms/shared";
import { EmptyState } from "@/components/empty-state";
import { WeightChart } from "@/components/charts/weight-chart";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { selectClass } from "@/components/ui/form-field";

export const metadata = { title: "健康记录" };

const PAGE_SIZE = 10;
const healthTypes = ["疫苗", "驱虫", "体检", "用药", "疾病", "绝育", "体重"] as const;
const tones: Record<string, string> = {
  疫苗: "bg-emerald-500/10 text-emerald-600",
  驱虫: "bg-amber-500/10 text-amber-600",
  体检: "bg-sky-500/10 text-sky-600",
  用药: "bg-violet-500/10 text-violet-600",
  疾病: "bg-red-500/10 text-red-600",
  绝育: "bg-pink-500/10 text-pink-600",
  体重: "bg-[var(--sage-soft)] text-[var(--sage)]",
};

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  const params = await searchParams;
  const selectedType = healthTypes.includes(params.type as typeof healthTypes[number]) ? params.type || "" : "";
  const requestedPage = parsePage(params.page);
  const dog = await prisma.dog.findFirst();

  const where = dog ? { dogId: dog.id, ...(selectedType ? { type: selectedType } : {}) } : null;
  const [recordCount, reminders, weights, latestWeightRecord] = dog ? await Promise.all([
    prisma.healthRecord.count({ where: where! }),
    prisma.reminder.findMany({
      where: { dogId: dog.id, completed: false, dueAt: { gte: new Date(new Date().toDateString()) } },
      orderBy: { dueAt: "asc" },
      take: 3,
    }),
    prisma.healthRecord.findMany({
      where: { dogId: dog.id, weightGrams: { not: null } },
      orderBy: { date: "asc" },
      select: { date: true, weightGrams: true },
    }),
    prisma.healthRecord.findFirst({
      where: { dogId: dog.id, weightGrams: { not: null } },
      orderBy: { date: "desc" },
      select: { weightGrams: true },
    }),
  ]) : [0, [], [], null];

  const totalPages = Math.max(1, Math.ceil(recordCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const records = dog ? await prisma.healthRecord.findMany({
    where: where!,
    orderBy: { date: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  }) : [];
  const weightData = weights.map((item) => ({ date: formatDate(item.date, "M/d"), weight: (item.weightGrams || 0) / 1000 }));
  const latestWeight = latestWeightRecord?.weightGrams;

  return <div className="page-enter">
    <PageHeader eyebrow="HEALTH" title="健康与关怀" description="把疫苗、驱虫、用药和体重放在一起，照顾就会更有把握。" action={<HealthForm disabled={!dog} />} />

    <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="soft-card rounded-3xl p-5"><div className="grid size-10 place-items-center rounded-2xl bg-[var(--sage-soft)] text-[var(--sage)]"><Scale className="size-5" /></div><p className="mt-5 text-xs text-[var(--muted)]">最近体重</p><p className="mt-1 text-2xl font-semibold">{latestWeight ? `${(latestWeight / 1000).toFixed(2)} kg` : "等待记录"}</p></div>
        <div className="soft-card rounded-3xl p-5"><div className="grid size-10 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><CalendarClock className="size-5" /></div><p className="mt-5 text-xs text-[var(--muted)]">下次提醒</p><p className="mt-1 truncate text-lg font-semibold">{reminders[0]?.title || "暂无提醒"}</p><p className="mt-1 text-xs text-[var(--muted)]">{reminders[0] ? formatDate(reminders[0].dueAt) : "新增健康记录时可以设置"}</p></div>
      </div>
      <Card><CardHeader><div><CardTitle>体重趋势</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">长期趋势比单次数字更重要</p></div><Activity className="size-5 text-[var(--sage)]" /></CardHeader><CardContent><WeightChart data={weightData} compact /></CardContent></Card>
    </section>

    {reminders.length > 0 && <section className="mb-6 rounded-3xl bg-[var(--orange-soft)] p-5 sm:p-6"><div className="flex items-center gap-3"><ShieldPlus className="size-5 text-[var(--orange)]" /><h2 className="font-semibold">接下来的提醒</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{reminders.map((item) => <div key={item.id} className="rounded-2xl bg-white/55 p-4 dark:bg-white/[.06]"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(item.dueAt)}</p></div>)}</div></section>}

    <section id="health-records" className="soft-card scroll-mt-24 rounded-3xl">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><h2 className="font-semibold">健康时间线</h2><p className="mt-1 text-xs text-[var(--muted)]">最近记录优先 · 每页 10 条</p></div>
        <form className="flex gap-2">
          <div className="relative min-w-0 flex-1 sm:w-44"><Filter className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--muted)]" /><select name="type" defaultValue={selectedType} aria-label="健康类型" className={cn(selectClass, "h-9 rounded-xl border-0 bg-black/[.025] pl-10 pr-8 focus:ring-0 dark:bg-white/[.04]")}><option value="">全部类型</option>{healthTypes.map((type) => <option key={type}>{type}</option>)}</select></div>
          <Button type="submit" size="sm">查询</Button>
          {selectedType && <Button asChild size="sm" variant="ghost"><Link href="/health#health-records">清除</Link></Button>}
        </form>
      </div>

      {!dog ? <EmptyState title="先创建小狗档案" description="有了档案后，才能开始记录健康信息。" /> : records.length ? <>
        <div className="divide-y">{records.map((record) => <article key={record.id} className="flex gap-4 p-4 sm:p-5">
          <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tones[record.type] || "bg-stone-500/10"}`}><HeartPulse className="size-5" /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{record.title}</h3><Badge>{record.type}</Badge>{record.weightGrams && <Badge className="bg-[var(--sage-soft)] text-[#5f775f] dark:text-[#bdd8bb]">{(record.weightGrams / 1000).toFixed(2)} kg</Badge>}</div><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(record.date)}{record.nextReminderDate ? ` · 下次 ${formatDate(record.nextReminderDate)}` : ""}</p></div><div className="flex"><HealthForm initial={{ id: record.id, type: record.type as never, title: record.title, date: toDateInput(record.date), notes: record.notes || "", weightKg: record.weightGrams ? record.weightGrams / 1000 : "", nextReminderDate: toDateInput(record.nextReminderDate) }} /><DeleteButton action={deleteHealthAction.bind(null, record.id)} /></div></div>{record.notes && <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{record.notes}</p>}</div>
        </article>)}</div>
        <Pagination pathname="/health" page={page} totalPages={totalPages} params={{ type: selectedType }} anchor="health-records" />
      </> : <EmptyState title={selectedType ? `没有${selectedType}记录` : "还没有健康记录"} description={selectedType ? "换一个类型或清除筛选后再看看。" : "从最近一次体重、驱虫或疫苗开始补记就好。"} action={!selectedType ? <HealthForm disabled={!dog} /> : undefined} />}
    </section>
  </div>;
}
