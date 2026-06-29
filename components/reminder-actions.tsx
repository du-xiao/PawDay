"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { cancelReminderAction, completeReminderAction } from "@/actions/app";
import { cn } from "@/lib/utils";

export function ReminderActions({ id, className }: { id: string; className?: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: "complete" | "cancel") {
    startTransition(async () => {
      const result = action === "complete"
        ? await completeReminderAction(id)
        : await cancelReminderAction(id);
      if (result.ok) {
        toast.success(action === "complete" ? "提醒已完成" : "提醒已取消");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className={cn("grid grid-cols-2 gap-1 rounded-2xl bg-black/[.035] p-1 dark:bg-white/[.06]", className)}>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("complete")}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[var(--sage-soft)] px-3 text-sm font-semibold text-[#587158] shadow-sm shadow-stone-900/[.025] transition hover:brightness-[.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#b9d6b8]"
      >
        <Check className="size-3.5" aria-hidden="true" />
        完成
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("cancel")}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-white/70 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-white/[.08] dark:hover:text-red-300"
      >
        <X className="size-3.5" aria-hidden="true" />
        取消
      </button>
    </div>
  );
}
