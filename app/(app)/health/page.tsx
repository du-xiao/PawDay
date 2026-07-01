import { startOfMonth } from "date-fns";
import { Activity, ClipboardList, Scale } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { deleteHealthAction } from "@/actions/app";
import { isGuestRole } from "@/lib/roles";
import { formatDate, toDateInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { HealthForm } from "@/components/forms/health-form";
import { DeleteButton, RecordActions } from "@/components/forms/shared";
import { EmptyState } from "@/components/empty-state";
import { WeightChart } from "@/components/charts/weight-chart";
import { Pagination } from "@/components/pagination";
import { TypeFilterForm } from "@/components/type-filter-form";
import { TypeIcon } from "@/components/type-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "健康记录" };

const PAGE_SIZE = 10;
const healthTypes = ["疫苗", "驱虫", "体检", "用药", "疾病", "绝育", "体重"] as const;
function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const params = await searchParams;
  const selectedType = healthTypes.includes(params.type as typeof healthTypes[number]) ? params.type || "" : "";
  const requestedPage = parsePage(params.page);
  const dog = await prisma.dog.findFirst();
  const monthStart = startOfMonth(new Date());

  const where = dog ? { dogId: dog.id, ...(selectedType ? { type: selectedType } : {}) } : null;
  const [recordCount, totalRecordCount, monthRecordCount, weights, latestWeightRecord] = dog ? await Promise.all([
    prisma.healthRecord.count({ where: where! }),
    prisma.healthRecord.count({ where: { dogId: dog.id } }),
    prisma.healthRecord.count({ where: { dogId: dog.id, date: { gte: monthStart } } }),
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
  ]) : [0, 0, 0, [], null];

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
    <PageHeader eyebrow="HEALTH" title="健康与关怀" description="把疫苗、驱虫、用药和体重放在一起，照顾就会更有把握。" action={canWrite ? <HealthForm disabled={!dog} /> : undefined} />

    <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,2fr)]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <HealthMetric icon={Scale} label="最近体重" value={latestWeight ? `${(latestWeight / 1000).toFixed(2)} kg` : "等待记录"} meta={latestWeight ? "体重趋势会持续记录变化" : "新增体重记录后会显示这里"} tone="sage" />
        <HealthMetric icon={ClipboardList} label="本月记录" value={`${monthRecordCount} 条`} meta={totalRecordCount ? `累计 ${totalRecordCount} 条健康记录` : "从最近一次护理开始补记"} tone="violet" />
      </div>
      <Card><CardHeader><div><CardTitle>体重趋势</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">长期趋势比单次数字更重要</p></div><Activity className="size-5 text-[var(--sage)]" /></CardHeader><CardContent><WeightChart data={weightData} compact /></CardContent></Card>
    </section>

    <section id="health-records" className="soft-card scroll-mt-24 rounded-3xl">
      <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-end lg:justify-between sm:p-6">
        <div><h2 className="font-semibold">健康时间线</h2><p className="mt-1 text-xs text-[var(--muted)]">最近记录优先 · 每页 10 条</p></div>
        <TypeFilterForm action="/health#health-records" name="type" value={selectedType} options={healthTypes} allLabel="全部类型" ariaLabel="健康类型" />
      </div>

      {!dog ? <EmptyState title="先创建小狗档案" description="有了档案后，才能开始记录健康信息。" /> : records.length ? <>
        <div className="divide-y">{records.map((record) => <article key={record.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
          <TypeIcon kind="health" type={record.type} />
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{record.title}</h3><Badge>{record.type}</Badge>{record.weightGrams && <Badge className="bg-[var(--sage-soft)] text-[#5f775f] dark:text-[#bdd8bb]">{(record.weightGrams / 1000).toFixed(2)} kg</Badge>}</div><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(record.date)}{record.nextReminderDate ? ` · 下次 ${formatDate(record.nextReminderDate)}` : ""}</p></div>{canWrite && <RecordActions><HealthForm initial={{ id: record.id, type: record.type as never, title: record.title, date: toDateInput(record.date), notes: record.notes || "", weightKg: record.weightGrams ? record.weightGrams / 1000 : "", nextReminderDate: toDateInput(record.nextReminderDate) }} /><DeleteButton action={deleteHealthAction.bind(null, record.id)} /></RecordActions>}</div>{record.notes && <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{record.notes}</p>}</div>
        </article>)}</div>
        <Pagination pathname="/health" page={page} totalPages={totalPages} params={{ type: selectedType }} anchor="health-records" />
      </> : <EmptyState title={selectedType ? `没有${selectedType}记录` : "还没有健康记录"} description={selectedType ? "换一个类型或选择全部类型后再看看。" : "从最近一次体重、驱虫或疫苗开始补记就好。"} action={canWrite && !selectedType ? <HealthForm disabled={!dog} /> : undefined} />}
    </section>
  </div>;
}

function HealthMetric({ icon: Icon, label, value, meta, tone }: { icon: typeof Scale; label: string; value: string; meta: string; tone: "sage" | "violet" }) {
  const tones = {
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  };
  return <div className="soft-card min-w-0 rounded-3xl p-5"><div className={`grid size-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5" /></div><p className="mt-5 text-xs text-[var(--muted)]">{label}</p><p className="mt-1 truncate text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{meta}</p></div>;
}
