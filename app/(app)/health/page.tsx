import { differenceInCalendarDays } from "date-fns";
import { Activity, CalendarClock, Scale, ShieldPlus } from "lucide-react";
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
import { PetFilterForm } from "@/components/pet-filter-form";
import { ReminderCard } from "@/components/reminder-card";
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

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string; pet?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const params = await searchParams;
  const selectedType = healthTypes.includes(params.type as typeof healthTypes[number]) ? params.type || "" : "";
  const pets = await prisma.dog.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, species: true } });
  const petOptions = pets.map((item) => ({ id: item.id, name: item.name, species: item.species }));
  const selectedPetId = pets.some((item) => item.id === params.pet) ? params.pet || "" : "";
  const chartPet = pets.find((item) => item.id === (selectedPetId || pets[0]?.id));
  const requestedPage = parsePage(params.page);
  const dogWhere = selectedPetId ? { dogId: selectedPetId } : { dogId: { in: pets.map((item) => item.id) } };
  const where = pets.length ? { ...dogWhere, ...(selectedType ? { type: selectedType } : {}) } : null;
  const [recordCount, reminders, weights, latestWeightRecord] = pets.length ? await Promise.all([
    prisma.healthRecord.count({ where: where! }),
    prisma.reminder.findMany({
      where: { ...dogWhere, completed: false },
      include: { dog: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 6,
    }),
    prisma.healthRecord.findMany({
      where: { dogId: chartPet?.id || "", weightGrams: { not: null } },
      orderBy: { date: "asc" },
      select: { date: true, weightGrams: true },
    }),
    prisma.healthRecord.findFirst({
      where: { ...dogWhere, weightGrams: { not: null } },
      orderBy: { date: "desc" },
      select: { weightGrams: true, dog: { select: { name: true } } },
    }),
  ]) : [0, [], [], null];

  const totalPages = Math.max(1, Math.ceil(recordCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const records = pets.length ? await prisma.healthRecord.findMany({
    where: where!,
    include: { dog: { select: { name: true } } },
    orderBy: { date: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  }) : [];
  const weightData = weights.map((item) => ({ date: formatDate(item.date, "M/d"), weight: (item.weightGrams || 0) / 1000 }));
  const latestWeight = latestWeightRecord?.weightGrams;

  return <div className="page-enter">
    <PageHeader eyebrow="HEALTH" title="健康与关怀" description="把每只宠物的疫苗、驱虫、用药和体重放在一起，照顾就会更有把握。" action={canWrite ? <HealthForm pets={petOptions} disabled={!pets.length} /> : undefined} />

    <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="soft-card rounded-3xl p-5"><div className="grid size-10 place-items-center rounded-2xl bg-[var(--sage-soft)] text-[var(--sage)]"><Scale className="size-5" /></div><p className="mt-5 text-xs text-[var(--muted)]">最近体重{latestWeightRecord?.dog.name ? ` · ${latestWeightRecord.dog.name}` : ""}</p><p className="mt-1 text-2xl font-semibold">{latestWeight ? `${(latestWeight / 1000).toFixed(2)} kg` : "等待记录"}</p></div>
        <div className="soft-card rounded-3xl p-5"><div className="grid size-10 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><CalendarClock className="size-5" /></div><p className="mt-5 text-xs text-[var(--muted)]">待处理提醒</p><p className="mt-1 truncate text-lg font-semibold">{reminders[0]?.title || "暂无提醒"}</p><p className="mt-1 text-xs text-[var(--muted)]">{reminders[0] ? reminderDetail(reminders[0].dueAt) : "新增健康记录时可以设置"}</p></div>
      </div>
      <Card><CardHeader><div><CardTitle>体重趋势</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">{chartPet ? `${chartPet.name} 的长期趋势比单次数字更重要` : "记录一次体重后，趋势会出现在这里"}</p></div><Activity className="size-5 text-[var(--sage)]" /></CardHeader><CardContent><WeightChart data={weightData} compact /></CardContent></Card>
    </section>

    {reminders.length > 0 && <section className="mb-6 rounded-3xl bg-[var(--orange-soft)] p-5 sm:p-6"><div className="flex items-center gap-3"><ShieldPlus className="size-5 text-[var(--orange)]" /><div><h2 className="font-semibold">待处理提醒</h2><p className="mt-1 text-xs text-[var(--muted)]">到期时间越近越靠前，逾期会保持标红。</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{reminders.map((item) => {
      const overdue = differenceInCalendarDays(item.dueAt, new Date()) < 0;
      return <ReminderCard key={item.id} id={item.id} title={selectedPetId ? item.title : `${item.dog.name} · ${item.title}`} type={item.type} detail={reminderDetail(item.dueAt)} overdue={overdue} canWrite={canWrite} />;
    })}</div></section>}

    <section id="health-records" className="soft-card scroll-mt-24 rounded-3xl">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><h2 className="font-semibold">健康时间线</h2><p className="mt-1 text-xs text-[var(--muted)]">最近记录优先 · 每页 10 条</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <PetFilterForm action="/health#health-records" value={selectedPetId} pets={petOptions} hidden={{ type: selectedType }} />
          <TypeFilterForm action="/health#health-records" name="type" value={selectedType} options={healthTypes} allLabel="全部类型" ariaLabel="健康类型" hidden={{ pet: selectedPetId }} />
        </div>
      </div>

      {!pets.length ? <EmptyState title="先创建宠物档案" description="有了档案后，才能开始记录健康信息。" /> : records.length ? <>
        <div className="divide-y">{records.map((record) => <article key={record.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
          <TypeIcon kind="health" type={record.type} />
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{record.title}</h3><Badge className="bg-[var(--orange-soft)] text-[#9a5838] dark:text-[#ffc19d]">{record.dog.name}</Badge><Badge>{record.type}</Badge>{record.weightGrams && <Badge className="bg-[var(--sage-soft)] text-[#5f775f] dark:text-[#bdd8bb]">{(record.weightGrams / 1000).toFixed(2)} kg</Badge>}</div><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(record.date)}{record.nextReminderDate ? ` · 下次 ${formatDate(record.nextReminderDate)}` : ""}</p></div>{canWrite && <RecordActions><HealthForm pets={petOptions} initial={{ id: record.id, dogId: record.dogId, type: record.type as never, title: record.title, date: toDateInput(record.date), notes: record.notes || "", weightKg: record.weightGrams ? record.weightGrams / 1000 : "", nextReminderDate: toDateInput(record.nextReminderDate) }} /><DeleteButton action={deleteHealthAction.bind(null, record.id)} /></RecordActions>}</div>{record.notes && <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{record.notes}</p>}</div>
        </article>)}</div>
        <Pagination pathname="/health" page={page} totalPages={totalPages} params={{ type: selectedType, pet: selectedPetId }} anchor="health-records" />
      </> : <EmptyState title={selectedType ? `没有${selectedType}记录` : "还没有健康记录"} description={selectedType ? "换一个类型或选择全部类型后再看看。" : "从最近一次体重、驱虫或疫苗开始补记就好。"} action={canWrite && !selectedType ? <HealthForm pets={petOptions} disabled={!pets.length} /> : undefined} />}
    </section>
  </div>;
}

function reminderDetail(dueAt: Date) {
  const days = differenceInCalendarDays(dueAt, new Date());
  if (days === 0) return `今天到期 · ${formatDate(dueAt)}`;
  if (days < 0) return `已逾期 ${Math.abs(days)} 天 · ${formatDate(dueAt)}`;
  return `${days} 天后 · ${formatDate(dueAt)}`;
}
