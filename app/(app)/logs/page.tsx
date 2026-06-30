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

const types = ["喂食", "外出", "遛狗", "洗澡", "排便", "睡眠", "训练", "玩耍", "情绪", "其他"];

export const metadata = { title: "日常记录" };

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; pet?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const { q = "", type = "", pet = "" } = await searchParams;
  const pets = await prisma.dog.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, species: true } });
  const petOptions = pets.map((item) => ({ id: item.id, name: item.name, species: item.species }));
  const selectedPetId = pets.some((item) => item.id === pet) ? pet : "";
  const dogWhere = selectedPetId ? { dogId: selectedPetId } : { dogId: { in: pets.map((item) => item.id) } };
  const logs = pets.length ? await prisma.dailyLog.findMany({
    where: {
      ...dogWhere,
      ...(type ? { type } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { notes: { contains: q } }] } : {}),
    },
    include: { dog: { select: { name: true, species: true } } },
    orderBy: { occurredAt: "desc" },
  }) : [];
  const groups = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const key = format(log.occurredAt, "yyyy-MM-dd");
    (acc[key] ??= []).push(log);
    return acc;
  }, {});
  const hasFilters = Boolean(q || type);

  return <div className="page-enter">
    <PageHeader eyebrow="DAILY LOGS" title="日常记录" description="吃饭、散步、好心情，每一个普通瞬间都在组成它们的一生。" action={canWrite ? <LogForm pets={petOptions} disabled={!pets.length} /> : undefined} />

    <LogFilterForm q={q} type={type} pet={selectedPetId} pets={petOptions} types={types} />

    {!pets.length ? <div className="soft-card rounded-3xl">
      <EmptyState title="先创建宠物档案" description="有了猫咪或狗狗档案后，才能开始记录它们的每一天。" />
    </div> : logs.length ? <div className="space-y-8">
      {Object.entries(groups).map(([day, items]) => <section key={day}>
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-semibold">{format(new Date(`${day}T00:00:00`), "M月d日 EEEE", { locale: zhCN })}</span>
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span className="text-xs text-[var(--muted)]">{items.length} 条</span>
        </div>
        <div className="space-y-3">
          {items.map((log) => <article key={log.id} className="soft-card group rounded-3xl p-4 sm:p-5">
            <div className="flex gap-3 sm:gap-4">
              <TypeIcon kind="log" type={log.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{log.title}</h3>
                      <Badge className="bg-[var(--orange-soft)] text-[#9a5838] dark:text-[#ffc19d]">{log.dog.name}</Badge>
                      <Badge>{log.type}</Badge>
                      {log.mood && <Badge className="bg-[var(--sage-soft)] text-[#5f775f] dark:text-[#b8d4b6]">{log.mood}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(log.occurredAt)}</p>
                  </div>
                  {canWrite && <RecordActions>
                    <LogForm pets={petOptions} initial={{ id: log.id, dogId: log.dogId, type: log.type as never, title: log.title, notes: log.notes || "", occurredAt: toDateTimeInput(log.occurredAt), mood: (log.mood || "未记录") as never, imageUrl: log.imageUrl || "" }} />
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
    </div> : <div className="soft-card rounded-3xl">
      <EmptyState title={hasFilters ? "没有找到符合条件的记录" : "还没有日常记录"} description={hasFilters ? "换个关键词或清除筛选，再看看。" : "今天发生的第一件小事，就从这里写下吧。"} action={canWrite && !hasFilters ? <LogForm pets={petOptions} /> : undefined} />
    </div>}
  </div>;
}
