import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { differenceInCalendarDays, endOfMonth, startOfMonth } from "date-fns";
import { ArrowUpRight, CalendarHeart, CircleDollarSign, Clock3, HeartPulse, NotebookPen, PawPrint } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isGuestRole } from "@/lib/roles";
import { imageVariantUrl } from "@/lib/image-variants";
import { cn, daysTogether, dogAge, formatDate, formatDateTime, money } from "@/lib/utils";
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
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const dog = await prisma.dog.findFirst();

  if (!dog) {
    return (
      <div className="page-enter">
        <div className="relative overflow-hidden rounded-[2rem] border bg-[var(--card)] p-6 sm:p-10 lg:min-h-[620px] lg:p-14">
          <div className="relative z-10 max-w-xl">
            <Badge className="bg-[var(--sage-soft)] text-[#587158] dark:text-[#b9d6b8]">第一次来到 PawDay</Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl">先把它的名字，<br />写进这里。</h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--muted)] sm:text-lg">创建小狗档案后，就可以开始记录散步、健康、照片和每一件值得记住的小事。</p>
            {canWrite && <div className="mt-8"><DogForm onboarding /></div>}
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
    prisma.reminder.findFirst({ where: { dogId: dog.id, completed: false }, orderBy: { dueAt: "asc" } }),
    prisma.healthRecord.findMany({ where: { dogId: dog.id, weightGrams: { not: null } }, orderBy: { date: "asc" }, take: 12 }),
  ]);
  const together = daysTogether(dog.adoptionDate);
  const chart = weights.map((item) => ({ date: formatDate(item.date, "M/d"), weight: (item.weightGrams || 0) / 1000 }));
  const reminderOverdue = reminder ? differenceInCalendarDays(reminder.dueAt, now) < 0 : false;

  return (
    <div className="page-enter space-y-6 sm:space-y-8">
      <section>
        <p className="text-sm font-medium text-[var(--orange)]">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(now)}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">今天也要好好生活。</h1>
        <p className="mt-3 text-[var(--muted)]">陪 {dog.name} 认真度过普通的一天。</p>
      </section>

      <section className="soft-card relative overflow-hidden rounded-[2.25rem] p-4 sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(232,137,95,.22),transparent_34%),linear-gradient(135deg,rgba(255,246,235,.92),rgba(255,255,255,.56)_48%,rgba(220,231,217,.42))] dark:bg-[radial-gradient(circle_at_8%_0%,rgba(232,137,95,.18),transparent_34%),linear-gradient(135deg,rgba(70,48,37,.42),rgba(255,255,255,.035)_48%,rgba(77,97,75,.16))]" />
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-[var(--orange-soft)]/70 blur-3xl" />
        <div className="absolute -bottom-24 left-16 size-56 rounded-full bg-[var(--sage-soft)]/60 blur-3xl" />
        <div className="relative z-10 sm:hidden">
          <div className="flex items-center gap-3.5">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-[1.35rem] border border-white/75 bg-white/75 shadow-lg shadow-orange-200/25 ring-1 ring-black/[.03] dark:border-white/10 dark:bg-white/[.08] dark:shadow-black/20 dark:ring-white/[.06]">
              {dog.avatarUrl ? <Image src={imageVariantUrl(dog.avatarUrl, "thumb")} alt={dog.name} fill priority unoptimized className="object-cover" sizes="80px" /> : <div className="grid size-full place-items-center"><PawPrint className="size-10 text-[var(--orange)]" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[var(--orange)]">MY BEST FRIEND</p>
              <h2 className="mt-1 truncate text-3xl font-semibold tracking-[-.055em]">{dog.name}</h2>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">今天也在认真长大，慢慢留下普通日子里的小事。</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <ProfileFact label="品种" value={dog.breed || "未记录"} tone="orange" />
            <ProfileFact label="性别" value={dog.sex || "未知"} tone="sage" />
            <ProfileFact label="年龄" value={dogAge(dog.birthDate)} tone="gold" />
            <ProfileFact label="陪伴" value={together ? `${together} 天` : "待记录"} tone="violet" />
          </div>

          <Button asChild variant="outline" className="mt-4 w-full border-orange-200/70 bg-white/70 text-[#8d4d2f] shadow-sm shadow-orange-200/20 hover:bg-white/85 dark:border-white/10 dark:bg-white/[.06] dark:text-[#ffc09b] dark:hover:bg-white/[.1]">
            <Link href="/dog">查看档案<ArrowUpRight className="size-4" /></Link>
          </Button>
        </div>

        <div className="relative z-10 hidden sm:block">
          <div className="flex items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-5">
              <div className="relative size-28 shrink-0 overflow-hidden rounded-[1.65rem] border border-white/70 bg-white/70 shadow-xl shadow-orange-200/25 ring-1 ring-black/[.03] lg:size-32 dark:border-white/10 dark:bg-white/[.08] dark:shadow-black/20 dark:ring-white/[.06]">
                {dog.avatarUrl ? <Image src={imageVariantUrl(dog.avatarUrl, "thumb")} alt={dog.name} fill priority unoptimized className="object-cover" sizes="(max-width: 1024px) 112px, 128px" /> : <div className="grid size-full place-items-center"><PawPrint className="size-12 text-[var(--orange)]" /></div>}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[.24em] text-[var(--orange)]">MY BEST FRIEND</p>
                <h2 className="mt-2 text-5xl font-semibold tracking-[-.055em]">{dog.name}</h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)]">今天也在认真长大。把普通日子里的吃饭、散步、健康和小表情都慢慢留下来。</p>
              </div>
            </div>

            <Button asChild variant="outline" className="shrink-0 border-orange-200/70 bg-white/70 text-[#8d4d2f] shadow-sm shadow-orange-200/20 hover:bg-white/85 dark:border-white/10 dark:bg-white/[.06] dark:text-[#ffc09b] dark:hover:bg-white/[.1]">
              <Link href="/dog">查看档案<ArrowUpRight className="size-4" /></Link>
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-3">
            <ProfileFact label="品种" value={dog.breed || "未记录"} tone="orange" />
            <ProfileFact label="性别" value={dog.sex || "未知"} tone="sage" />
            <ProfileFact label="年龄" value={dogAge(dog.birthDate)} tone="gold" />
            <ProfileFact label="陪伴" value={together ? `${together} 天` : "待记录"} tone="violet" />
          </div>
        </div>
        <PawPrint className="absolute -bottom-12 -right-5 size-44 rotate-[-18deg] text-[var(--orange)] opacity-[.055]" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={NotebookPen}
          label="最近记录"
          value={logs.length ? logs[0].title : "还没有记录"}
          meta={logs.length ? formatDateTime(logs[0].occurredAt) : "从今天开始"}
          tone="orange"
          action={canWrite ? <LogForm triggerLabel="新增" triggerVariant="ghost" triggerSize="sm" triggerClassName={addButtonClass} /> : undefined}
        />
        <Stat
          icon={HeartPulse}
          label="最近健康"
          value={health.length ? health[0].title : "等待第一次记录"}
          meta={health.length ? formatDate(health[0].date) : "体重、疫苗、驱虫"}
          tone="sage"
          action={canWrite ? <HealthForm triggerLabel="新增" triggerVariant="ghost" triggerSize="sm" triggerClassName={addButtonClass} /> : undefined}
        />
        <Stat
          icon={CircleDollarSign}
          label="本月开销"
          value={money(expenses._sum.amountCents || 0)}
          meta="本月累计"
          tone="gold"
          action={canWrite ? <ExpenseForm triggerLabel="新增" triggerVariant="ghost" triggerSize="sm" triggerClassName={addButtonClass} /> : undefined}
        />
        <Stat
          icon={CalendarHeart}
          label="下次提醒"
          value={reminder ? reminder.title : "暂时没有提醒"}
          meta={reminder ? reminderDetail(reminder.dueAt, now) : "可以在健康记录中设置"}
          tone={reminderOverdue ? "red" : "violet"}
          href="/health"
          urgent={reminderOverdue}
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

function reminderDetail(dueAt: Date, now: Date) {
  const days = differenceInCalendarDays(dueAt, now);
  if (days === 0) return `今天到期 · ${formatDate(dueAt)}`;
  if (days < 0) return `已逾期 ${Math.abs(days)} 天 · ${formatDate(dueAt)}`;
  return `${days} 天后 · ${formatDate(dueAt)}`;
}

function Stat({ icon: Icon, label, value, meta, tone, action, href, urgent }: { icon: typeof Clock3; label: string; value: string; meta: string; tone: string; action?: ReactNode; href?: string; urgent?: boolean }) {
  const tones: Record<string, string> = {
    orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    gold: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
  };
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className={`grid size-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5" /></div>
        {action || (href ? <ArrowUpRight className="size-4 text-[var(--muted)]" /> : null)}
      </div>
      <p className="mt-5 text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight">{value}</p>
      <p className={cn("mt-1 truncate text-xs text-[var(--muted)]", urgent && "font-medium text-red-600 dark:text-red-300")}>{meta}</p>
    </>
  );

  if (href) return <Link href={href} className={cn("soft-card block rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg", urgent && "border-red-500/20 bg-red-500/10 shadow-red-500/10")}>{content}</Link>;
  return <Card className="p-5">{content}</Card>;
}

function ProfileFact({ label, value, tone }: { label: string; value: string; tone: "orange" | "sage" | "gold" | "violet" }) {
  const tones = {
    orange: "from-[var(--orange)] to-[#f0ad81]",
    sage: "from-[var(--sage)] to-[#b9cdae]",
    gold: "from-amber-500 to-[#e5c075]",
    violet: "from-violet-500 to-[#b5a5d6]",
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-black/[.035] bg-white/[.66] p-3 shadow-sm shadow-stone-900/[.02] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md dark:border-white/[.08] dark:bg-white/[.045] dark:hover:bg-white/[.07]">
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--muted)]">{label}</p>
      <span className={`mt-1.5 block h-1 w-7 rounded-full bg-gradient-to-r ${tones[tone]}`} />
      <p className="mt-2 truncate text-sm font-semibold tracking-[-.02em] text-[var(--foreground)] sm:text-base">{value}</p>
    </div>
  );
}
