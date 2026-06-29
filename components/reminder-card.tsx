"use client";

import { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ReminderActions } from "@/components/reminder-actions";

export function ReminderCard({ id, title, type, detail, overdue, canWrite }: { id: string; title: string; type: string; detail: string; overdue: boolean; canWrite: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={cn("rounded-2xl border bg-white/60 p-3.5 shadow-sm shadow-stone-900/[.025] transition hover:bg-white/75 dark:bg-white/[.055] dark:hover:bg-white/[.075]", overdue && "border-red-500/15 bg-red-500/10 shadow-red-500/5 dark:bg-red-500/10")}>
      <button
        type="button"
        className={cn("flex w-full items-start gap-3 text-left outline-none focus-visible:ring-4 focus-visible:ring-orange-200/45", canWrite ? "cursor-pointer" : "cursor-default")}
        onClick={() => canWrite && setOpen((value) => !value)}
        aria-expanded={canWrite ? open : undefined}
      >
        <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--orange-soft)] text-[var(--orange)]", overdue && "bg-red-500/10 text-red-500")}>
          <CalendarClock className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className={cn("mt-1 block truncate text-xs text-[var(--muted)]", overdue && "font-medium text-red-600 dark:text-red-300")}>{detail}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge className={overdue ? "bg-red-500/10 text-red-600 dark:text-red-300" : undefined}>{type}</Badge>
          {canWrite && <ChevronDown className={cn("size-4 text-[var(--muted)] transition-transform", open && "rotate-180")} />}
        </span>
      </button>
      {canWrite && open && (
        <div className="mt-3 border-t pt-3">
          <ReminderActions id={id} />
        </div>
      )}
    </article>
  );
}
