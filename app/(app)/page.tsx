import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import { ArrowUpRight, CalendarHeart, CircleDollarSign, Clock3, HeartPulse, NotebookPen, PawPrint } from "lucide-react";
import { prisma } from "@/lib/db";
import { daysTogether, dogAge, formatDate, formatDateTime, money } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { DogForm } from "@/components/forms/dog-form";
import { ExpenseForm } from "@/components/forms/expense-form";
import { HealthForm } from "@/components/forms/health-form";
import { LogForm } from "@/components/forms/log-form";
import { WeightChart } from "@/components/charts/weight-chart";
import { TypeIcon } from "@/components/type-icon";

const addButtonClass = "h-8 rounded-xl px-2.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]";

export default async function DashboardPage() {
  const dog = await prisma.dog.findFirst();

  if (!dog) {
    return (
      <div className="page-enter">
        <div className="relative overflow-hidden rounded-[2rem] border bg-[var(--card)] p-6 sm:p-10 lg:min-h-[620px] lg:p-14">
          <div className="relative z-10 max-w-xl">
            <Badge className="bg-[var(--sage-soft)] text-[#587158] dark:text-[#b9d6b8]">第一次来到 PawDay</Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl">先把它的名字，<br />写进这里。</h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--muted)] sm:text-lg">创建小狗档案后，就可以开始记录散步、健康、照片和每一件值得记住的小事。</p>
            <div className="mt-8"><DogForm onboarding /></div>
          </div>
          <div className="relative mt-10 h-72 overflow-hidden rounded-[2rem] lg:absolute lg:inset-y-8 lg:right-8 lg:mt-0 lg:h-auto lg:w-[43%]">
            <Image src="/pawday-hero.png" alt="温暖的小狗插画" fill className="object-cover" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const [logs, health, expenses, reminder, weights] = await Promise.all([
    prisma.dailyLog.findMany({ where: { dogId: dog.id }, orderBy: { occurredAt: "desc" }, take: 5 }),
    prisma.healthRecord.findMany({ where: { dogId: dog.id }, orderBy: { date: "desc" }, take: 4 }),
    prisma.expense.aggregate({ where: { dogId: dog.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } }, _sum: { amountCents: true } }),
    prisma.reminder.findFirst({ where: { dogId: dog.id, completed: false, dueAt: { gte: new Date(now.toDateString()) } }, orderBy: { dueAt: "asc" } }),
    prisma.healthRecord.findMany({ where: { dogId: dog.id, weightGrams: { not: null } }, orderBy: { date: "asc" }, take: 12 }),
  ]);
  const together = daysTogether(dog.adoptionDate);
  const chart = weights.map((item) => ({ date: formatDate(item.date, "M/d"), weight: (item.weightGrams || 0) / 1000 }));

  return (
    <div className="page-enter space-y-6 sm:space-y-8">
      <section>
        <p className="text-sm font-medium text-[var(--orange)]">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(now)}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">今天也要好好生活。</h1>
        <p className="mt-3 text-[var(--muted)]">陪 {dog.name} 认真度过普通的一天。</p>
      </section>

      <section className="relative overflow-hidden rounded-[2.25rem] border border-orange-100/60 bg-[#d87959] p-3 text-white shadow-xl shadow-orange-300/20 dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.45),transparent_28%),linear-gradient(135deg,#f1b789_0%,#e6845c_52%,#c5665c_100%)]" />
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-[#8f3f31]/18 blur-3xl" />
        <div className="relative z-10 grid gap-3 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] lg:items-stretch">
          <div className="relative min-h-[260px] overflow-hidden rounded-[1.9rem] bg-white/15 shadow-2xl shadow-black/10 ring-1 ring-white/20 sm:min-h-[340px] lg:min-h-[360px]">
            {dog.avatarUrl ? <Image src={dog.avatarUrl} alt={dog.name} fill priority unoptimized className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" /> : <div className="grid size-full place-items-center"><PawPrint className="size-24 text-white/75" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/18 px-4 py-3 backdrop-blur-md ring-1 ring-white/15 lg:hidden">
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/70">PawDay Today</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-.04em]">{dog.name}</p>
            </div>
          </div>

          <div className="flex min-h-[280px] flex-col justify-between rounded-[1.9rem] bg-white/[.18] p-5 backdrop-blur-xl ring-1 ring-white/25 sm:p-6 lg:p-7">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.24em] text-white/70">MY BEST FRIEND</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-5xl lg:text-6xl">{dog.name}</h2>
                </div>
                <Button asChild variant="outline" className="w-full border-white/25 bg-white/15 text-white hover:bg-white/20 sm:w-auto">
                  <Link href="/dog">查看档案<ArrowUpRight className="size-4" /></Link>
                </Button>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/78 sm:text-base">今天也在认真长大。把普通日子里的吃饭、散步、健康和小表情都慢慢留下来。</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ProfileFact label="品种" value={dog.breed || "未记录"} />
              <ProfileFact label="性别" value={dog.sex || "未知"} />
              <ProfileFact label="年龄" value={dogAge(dog.birthDate)} />
              <ProfileFact label="陪伴" value={together ? `${together} 天` : "待记录"} />
            </div>
          </div>
        </div>
        <PawPrint className="absolute -bottom-16 -right-7 size-56 rotate-[-18deg] text-white/[.07]" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={NotebookPen}
          label="最近记录"
          value={logs.length ? logs[0].title : "还没有记录"}
          meta={logs.length ? formatDateTime(logs[0].occurredAt) : "从今天开始"}
          tone="orange"
          action={<LogForm triggerLabel="新增" triggerVariant="ghost" triggerSize="sm" triggerClassName={addButtonClass} />}
        />
        <Stat
          icon={HeartPulse}
          label="最近健康"
          value={health.length ? health[0].title : "等待第一次记录"}
          meta={health.length ? formatDate(health[0].date) : "体重、疫苗、驱虫"}
          tone="sage"
          action={<HealthForm triggerLabel="新增" triggerVariant="ghost" triggerSize="sm" triggerClassName={addButtonClass} />}
        />
        <Stat
          icon={CircleDollarSign}
          label="本月开销"
          value={money(expenses._sum.amountCents || 0)}
          meta="本月累计"
          tone="gold"
          action={<ExpenseForm triggerLabel="新增" triggerVariant="ghost" triggerSize="sm" triggerClassName={addButtonClass} />}
        />
        <Stat
          icon={CalendarHeart}
          label="下次提醒"
          value={reminder ? reminder.title : "暂时没有提醒"}
          meta={reminder ? formatDate(reminder.dueAt) : "可以在健康记录中设置"}
          tone="violet"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <div><CardTitle>最近的日子</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">刚刚发生的小事</p></div>
            <Button asChild size="sm" variant="ghost"><Link href="/logs">全部记录<ArrowUpRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent>
            {logs.length ? <div className="space-y-1">
              {logs.map((log) => <Link href="/logs" key={log.id} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-black/[.035] dark:hover:bg-white/[.04]">
                <TypeIcon kind="log" type={log.type} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{log.title}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{log.type} · {formatDateTime(log.occurredAt)}</p></div>
                {log.mood && <span className="text-xs text-[var(--muted)]">{log.mood}</span>}
              </Link>)}
            </div> : <EmptyState compact title="今天还没有记录" description="散步、吃饭、打盹，都值得被记下来。" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div><CardTitle>体重趋势</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">轻轻关注每一点变化</p></div>
            <Button asChild size="sm" variant="ghost"><Link href="/health">查看健康<ArrowUpRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent><WeightChart data={chart} compact /></CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, meta, tone, action }: { icon: typeof Clock3; label: string; value: string; meta: string; tone: string; action?: ReactNode }) {
  const tones: Record<string, string> = {
    orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    gold: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid size-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5" /></div>
        {action}
      </div>
      <p className="mt-5 text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight">{value}</p>
      <p className="mt-1 truncate text-xs text-[var(--muted)]">{meta}</p>
    </Card>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[.16] p-3 ring-1 ring-white/15 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/60">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">{value}</p>
    </div>
  );
}
