"use client";

import { Bug, ChevronRight, Syringe } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TypeIcon } from "@/components/type-icon";

export type DogHealthSummaryRecord = {
  id: string;
  type: "疫苗" | "驱虫";
  title: string;
  date: string;
  notes: string | null;
  weightGrams: number | null;
  nextReminderDate: string | null;
};

export function DogHealthSummary({ vaccines, deworming }: { vaccines: DogHealthSummaryRecord[]; deworming: DogHealthSummaryRecord[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <HealthGroup title="疫苗记录" description="免疫状态" records={vaccines} icon="vaccine" />
      <HealthGroup title="驱虫记录" description="内外驱虫" records={deworming} icon="deworm" />
    </div>
  );
}

function HealthGroup({ title, description, records, icon }: { title: string; description: string; records: DogHealthSummaryRecord[]; icon: "vaccine" | "deworm" }) {
  const latest = records[0];
  const Icon = icon === "vaccine" ? Syringe : Bug;
  const tone = icon === "vaccine"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <div className="rounded-3xl border bg-white/45 p-5 shadow-sm shadow-stone-900/[.02] dark:bg-white/[.035]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[.18em] text-[var(--muted)]">{description}</p>
        </div>
        <span className="rounded-full bg-black/[.04] px-2.5 py-1 text-xs font-semibold text-[var(--muted)] dark:bg-white/[.055]">{records.length} 条</span>
      </div>
      <p className="mt-5 text-lg font-semibold tracking-tight">{latest ? latest.title : "还没有记录"}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{latest ? formatDate(latest.date) : "新增健康记录后会自动汇总到这里"}</p>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="mt-5 w-full justify-between bg-black/[.025] text-[var(--foreground)] hover:bg-black/[.045] dark:bg-white/[.045] dark:hover:bg-white/[.07]">
            查看{title}
            <ChevronRight className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="dialog-scrollbar-hidden max-w-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>默认按记录时间从近到远展示，方便快速核对最近一次护理。</DialogDescription>
          </DialogHeader>
          {records.length ? (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record.id} className="flex gap-3 rounded-2xl border bg-white/45 p-3 dark:bg-white/[.035]">
                  <TypeIcon kind="health" type={record.type} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{record.title}</p>
                      <span className="rounded-full bg-black/[.04] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)] dark:bg-white/[.055]">{formatDate(record.date)}</span>
                    </div>
                    {record.nextReminderDate && <p className="mt-1 text-xs text-[var(--orange)]">下次提醒：{formatDate(record.nextReminderDate)}</p>}
                    {record.notes && <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{record.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed bg-white/35 p-8 text-center text-sm text-[var(--muted)] dark:bg-white/[.025]">还没有{title}，新增健康记录后会出现在这里。</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
