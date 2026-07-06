import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { deleteLogAction } from "@/actions/app";
import { isGuestRole } from "@/lib/roles";
import { formatDateTime, toDateTimeInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { LogForm } from "@/components/forms/log-form";
import { DeleteButton, RecordActions } from "@/components/forms/shared";
import { EmptyState } from "@/components/empty-state";
import { LogImageViewer } from "@/components/log-image-viewer";
import { LogFilterForm } from "@/components/log-filter-form";
import { TypeIcon } from "@/components/type-icon";
import { Badge } from "@/components/ui/badge";

const types = ["喂食", "遛狗", "洗澡", "排便", "睡眠", "训练", "情绪", "其他"];

export const metadata = { title: "日常记录" };

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const { q = "", type = "" } = await searchParams;
  const dog = await prisma.dog.findFirst();
  const logs = dog ? await prisma.dailyLog.findMany({
    where: {
      dogId: dog.id,
      ...(type ? { type } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { notes: { contains: q } }] } : {}),
    },
    orderBy: { occurredAt: "desc" },
  }) : [];
  const groups = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const key = format(log.occurredAt, "yyyy-MM-dd");
    (acc[key] ??= []).push(log);
    return acc;
  }, {});
  const hasFilters = Boolean(q || type);

  return <div className="page-enter">
    <PageHeader eyebrow="DAILY LOGS" title="日常记录" description="吃饭、散步、好心情，每一个普通瞬间都在组成它的一生。" action={canWrite ? <LogForm disabled={!dog} /> : undefined} />

    <LogFilterForm q={q} type={type} types={types} />

    {!dog ? <div className="soft-card rounded-2xl sm:rounded-3xl">
      <EmptyState title="先创建小狗档案" description="有了档案后，才能开始记录它的每一天。" />
    </div> : logs.length ? <div className="space-y-5 sm:space-y-8">
      {Object.entries(groups).map(([day, items]) => <section key={day} className="overflow-hidden rounded-2xl border bg-[var(--card)]/92 shadow-[inset_0_1px_0_var(--card-highlight),var(--shadow-soft)] sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none">
        <div className="flex items-center gap-3 border-b px-4 py-3 sm:mb-3 sm:border-0 sm:px-0 sm:py-0">
          <span className="min-w-0 truncate text-sm font-semibold">{format(new Date(`${day}T00:00:00`), "M月d日 EEEE", { locale: zhCN })}</span>
          <span className="hidden h-px flex-1 bg-[var(--line)] sm:block" />
          <span className="shrink-0 text-xs text-[var(--muted)]">{items.length} 条</span>
        </div>
        <div className="space-y-3 p-3 sm:p-0">
          {items.map((log) => <article key={log.id} className="group relative rounded-2xl border bg-[var(--card)]/72 p-3.5 shadow-sm shadow-stone-900/[.025] sm:rounded-3xl sm:border sm:bg-[var(--card)] sm:p-5 sm:[box-shadow:inset_0_1px_0_var(--card-highlight),var(--shadow-soft)]">
            <div className="flex gap-3 sm:gap-4">
              <TypeIcon kind="log" type={log.type} className="size-10 rounded-2xl sm:size-11" />
              <div className={`min-w-0 flex-1 ${canWrite ? "pr-20 sm:pr-0" : ""}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="min-w-0 break-words text-base font-semibold leading-snug sm:text-sm sm:font-medium">{log.title}</h3>
                      <Badge>{log.type}</Badge>
                      {log.mood && <Badge className="bg-[var(--sage-soft)] text-[#5f775f] dark:text-[#b8d4b6]">{log.mood}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(log.occurredAt)}</p>
                  </div>
                  {canWrite && <RecordActions className="absolute right-3 top-3 sm:static">
                    <LogForm initial={{ id: log.id, type: log.type as never, title: log.title, notes: log.notes || "", occurredAt: toDateTimeInput(log.occurredAt), mood: (log.mood || "未记录") as never, imageUrl: log.imageUrl || "" }} />
                    <DeleteButton action={deleteLogAction.bind(null, log.id)} />
                  </RecordActions>}
                </div>
                {log.notes && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">{log.notes}</p>}
                {log.imageUrl && <LogImageViewer src={log.imageUrl} alt={log.title} />}
              </div>
            </div>
          </article>)}
        </div>
      </section>)}
    </div> : <div className="soft-card rounded-2xl sm:rounded-3xl">
      <EmptyState title={hasFilters ? "没有找到符合条件的记录" : "还没有日常记录"} description={hasFilters ? "换个关键词或清除筛选，再看看。" : "今天发生的第一件小事，就从这里写下吧。"} action={canWrite && !hasFilters ? <LogForm /> : undefined} />
    </div>}
  </div>;
}
