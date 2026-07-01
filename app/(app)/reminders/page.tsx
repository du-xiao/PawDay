import Link from "next/link";
import { differenceInCalendarDays, endOfDay, startOfDay } from "date-fns";
import { BellRing, CalendarClock, CheckCircle2, Clock3, Repeat2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { deleteReminderAction } from "@/actions/app";
import { isGuestRole } from "@/lib/roles";
import { cn, formatDate, toDateInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ReminderActions } from "@/components/reminder-actions";
import { ReminderForm } from "@/components/forms/reminder-form";
import { DeleteButton, RecordActions } from "@/components/forms/shared";
import { TypeFilterForm } from "@/components/type-filter-form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "提醒中心" };

const reminderTypes = ["疫苗", "驱虫", "体检", "用药", "洗澡", "买粮", "美容", "保险", "证件", "其他"] as const;
const statuses = [
  { value: "active", label: "待处理" },
  { value: "completed", label: "已完成" },
  { value: "all", label: "全部" },
] as const;

function normalizeStatus(value?: string) {
  return statuses.some((item) => item.value === value) ? value as typeof statuses[number]["value"] : "active";
}

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const params = await searchParams;
  const dog = await prisma.dog.findFirst();
  const status = normalizeStatus(params.status);
  const selectedType = reminderTypes.includes(params.type as typeof reminderTypes[number]) ? params.type || "" : "";
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const where = dog ? {
    dogId: dog.id,
    ...(selectedType ? { type: selectedType } : {}),
    ...(status === "active" ? { completed: false } : status === "completed" ? { completed: true } : {}),
  } : null;

  const [reminders, stats] = dog ? await Promise.all([
    prisma.reminder.findMany({
      where: where!,
      orderBy: [{ completed: "asc" }, { dueAt: status === "completed" ? "desc" : "asc" }],
    }),
    prisma.reminder.findMany({
      where: { dogId: dog.id },
      select: { dueAt: true, completed: true, repeatInterval: true },
    }),
  ]) : [[], []];

  const active = stats.filter((item) => !item.completed);
  const overdueCount = active.filter((item) => item.dueAt < todayStart).length;
  const todayCount = active.filter((item) => item.dueAt >= todayStart && item.dueAt <= todayEnd).length;
  const repeatingCount = active.filter((item) => item.repeatInterval).length;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="REMINDERS" title="提醒中心" description="把固定节奏交给提醒，驱虫、洗澡、买粮就不容易漏掉。" action={canWrite ? <ReminderForm disabled={!dog} /> : undefined} />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BellRing} label="待处理" value={`${active.length} 项`} tone="orange" />
        <Metric icon={Clock3} label="已逾期" value={`${overdueCount} 项`} tone="red" />
        <Metric icon={CalendarClock} label="今天到期" value={`${todayCount} 项`} tone="sage" />
        <Metric icon={Repeat2} label="重复提醒" value={`${repeatingCount} 项`} tone="violet" />
      </section>

      <section id="reminder-list" className="soft-card scroll-mt-24 rounded-3xl">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold">提醒列表</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">待处理优先按到期日期排序，完成重复提醒会自动滚到下一次。</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <StatusTabs status={status} type={selectedType} />
            <TypeFilterForm action="/reminders#reminder-list" name="type" value={selectedType} options={reminderTypes} allLabel="全部类型" ariaLabel="提醒类型" hidden={{ status }} />
          </div>
        </div>

        {!dog ? (
          <EmptyState title="先创建小狗档案" description="有了档案后，才能开始设置提醒。" />
        ) : reminders.length ? (
          <div className="divide-y">
            {reminders.map((reminder) => {
              const overdue = !reminder.completed && differenceInCalendarDays(reminder.dueAt, now) < 0;
              return (
                <article key={reminder.id} className={cn("p-4 sm:p-5", overdue && "bg-red-500/[.035]")}>
                  <div className="flex gap-3 sm:gap-4">
                    <span className={cn("mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)] ring-1 ring-inset ring-black/5 dark:ring-white/10", reminder.completed && "bg-[var(--sage-soft)] text-[var(--sage)]", overdue && "bg-red-500/10 text-red-600 dark:text-red-300")}>
                      {reminder.completed ? <CheckCircle2 className="size-5" /> : <CalendarClock className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{reminder.title}</h3>
                            <Badge className={overdue ? "bg-red-500/10 text-red-600 dark:text-red-300" : undefined}>{reminder.type}</Badge>
                            {reminder.repeatInterval && reminder.repeatUnit && <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-300">每 {reminder.repeatInterval} {reminder.repeatUnit}</Badge>}
                          </div>
                          <p className={cn("mt-1 text-xs text-[var(--muted)]", overdue && "font-medium text-red-600 dark:text-red-300")}>
                            {reminder.completed ? `已完成 · ${formatDate(reminder.completedAt || reminder.updatedAt)}` : reminderDetail(reminder.dueAt, now)}
                          </p>
                        </div>
                        {canWrite && <RecordActions>
                          {!reminder.completed && <ReminderForm initial={{
                            id: reminder.id,
                            type: reminder.type as never,
                            title: reminder.title,
                            dueAt: toDateInput(reminder.dueAt),
                            repeatUnit: (reminder.repeatUnit || "不重复") as never,
                            repeatInterval: reminder.repeatInterval || "",
                            notes: reminder.notes || "",
                          }} />}
                          <DeleteButton action={deleteReminderAction.bind(null, reminder.id)} />
                        </RecordActions>}
                      </div>
                      {reminder.notes && !reminder.notes.startsWith("health:") && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">{reminder.notes}</p>}
                      {canWrite && !reminder.completed && <ReminderActions id={reminder.id} className="mt-4 max-w-sm" />}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title={emptyTitle(status, selectedType)} description={selectedType ? "换一个类型或选择全部类型后再看看。" : "下一次驱虫、洗澡、买粮，都可以先放在这里。"} action={canWrite && status === "active" && !selectedType ? <ReminderForm disabled={!dog} /> : undefined} />
        )}
      </section>
    </div>
  );
}

function StatusTabs({ status, type }: { status: string; type: string }) {
  return (
    <div className="grid grid-cols-3 rounded-2xl bg-black/[.035] p-1 text-xs font-semibold dark:bg-white/[.055]">
      {statuses.map((item) => {
        const href = `/reminders?status=${item.value}${type ? `&type=${encodeURIComponent(type)}` : ""}#reminder-list`;
        const active = status === item.value;
        return <Link key={item.value} href={href} className={cn("rounded-xl px-3 py-2 text-center text-[var(--muted)] transition hover:text-[var(--foreground)]", active && "bg-[var(--card)] text-[var(--foreground)] shadow-sm")}>{item.label}</Link>;
      })}
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof BellRing; label: string; value: string; tone: "orange" | "red" | "sage" | "violet" }) {
  const tones = {
    orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  };
  return <div className="soft-card rounded-3xl p-5"><div className={`grid size-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5" /></div><p className="mt-5 text-xs text-[var(--muted)]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p></div>;
}

function reminderDetail(dueAt: Date, now: Date) {
  const days = differenceInCalendarDays(dueAt, now);
  if (days === 0) return `今天到期 · ${formatDate(dueAt)}`;
  if (days < 0) return `已逾期 ${Math.abs(days)} 天 · ${formatDate(dueAt)}`;
  return `${days} 天后 · ${formatDate(dueAt)}`;
}

function emptyTitle(status: string, selectedType: string) {
  if (selectedType) return `没有${selectedType}提醒`;
  if (status === "completed") return "还没有完成的提醒";
  if (status === "all") return "还没有提醒";
  return "暂时没有待处理提醒";
}
