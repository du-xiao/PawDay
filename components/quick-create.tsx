"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExpenseForm } from "@/components/forms/expense-form";
import { HealthForm } from "@/components/forms/health-form";
import { LogForm } from "@/components/forms/log-form";
import { PhotoForm } from "@/components/forms/photo-form";

const quickButtonClass = "h-10 w-full justify-start rounded-xl px-3 text-sm shadow-none sm:h-11 sm:rounded-2xl sm:px-3.5";

export function QuickCreate({ canWrite, dogExists, logs }: { canWrite: boolean; dogExists: boolean; logs: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  if (!canWrite) return null;

  const disabled = !dogExists;

  return (
    <div className="no-print pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-3 z-40 sm:right-4 lg:bottom-7 lg:right-7">
      <div className={cn(
        "mb-2 w-[min(17rem,calc(100vw-1.5rem))] origin-bottom-right rounded-2xl border bg-[var(--card)]/96 p-2 shadow-2xl shadow-stone-950/12 backdrop-blur-xl transition sm:mb-3 sm:w-[min(18rem,calc(100vw-2rem))] sm:rounded-3xl",
        open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}>
        <div className="grid gap-1.5">
          <LogForm disabled={disabled} triggerLabel="日常记录" triggerVariant="ghost" triggerClassName={quickButtonClass} />
          <PhotoForm logs={logs} disabled={disabled} triggerLabel="上传照片" triggerVariant="ghost" triggerClassName={quickButtonClass} />
          <HealthForm disabled={disabled} triggerLabel="健康记录" triggerVariant="ghost" triggerClassName={quickButtonClass} />
          <ExpenseForm disabled={disabled} triggerLabel="记录开销" triggerVariant="ghost" triggerClassName={quickButtonClass} />
        </div>
        {!dogExists && <p className="px-3 pb-2 pt-1 text-xs leading-relaxed text-[var(--muted)]">先创建小狗档案后，就可以快速记录。</p>}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "关闭快速记录" : "打开快速记录"}
        aria-expanded={open}
        className="pointer-events-auto ml-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--orange)] to-[#d87755] text-white shadow-2xl shadow-orange-300/35 transition hover:brightness-105 active:scale-95 sm:size-14 sm:rounded-3xl dark:shadow-black/35"
      >
        {open ? <X className="size-5" /> : <Plus className="size-6" />}
      </button>
    </div>
  );
}
