"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/actions/app";

export function FormActions({ pending, submitLabel = "保存记录", onCancel, className }: { pending: boolean; submitLabel?: string; onCancel?: () => void; className?: string }) {
  return <div className={cn("mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3 [&>button]:w-full sm:[&>button]:w-auto", className)}>
    {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>}
    <Button type="submit" variant="warm" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{submitLabel}</Button>
  </div>;
}

export function DeleteButton({ action, label = "删除", onDeleted }: { action: () => Promise<ActionResult>; label?: string; onDeleted?: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return <Button
    type="button"
    size="sm"
    variant="danger"
    disabled={pending}
    onClick={() => {
      if (!window.confirm("确定删除这条记录吗？此操作无法撤销。")) return;
      startTransition(async () => {
        const result = await action();
        if (result.ok) {
          toast.success("已删除");
          onDeleted?.();
          router.refresh();
        } else toast.error(result.error);
      });
    }}
  >
    {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    {label}
  </Button>;
}

export function RecordActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(
    "flex shrink-0 items-center gap-1 rounded-full border border-black/[.06] bg-[var(--card)]/95 p-1 shadow-sm shadow-stone-900/[.06] backdrop-blur-md dark:border-white/[.08] dark:bg-[var(--card)]/85",
    "[&>button]:size-8 [&>button]:gap-0 [&>button]:rounded-full [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0 [&>button]:text-[0px] [&>button]:shadow-none [&>button>svg]:size-3.5",
    "[&>button:hover]:bg-black/[.045] [&>button:last-child]:text-red-500 [&>button:last-child:hover]:bg-red-500/10 dark:[&>button:hover]:bg-white/[.06]",
    "sm:gap-1 sm:rounded-2xl sm:border sm:border-black/[.055] sm:bg-[var(--card)]/82 sm:p-1 sm:shadow-sm sm:shadow-stone-900/[.04] sm:backdrop-blur-sm dark:sm:border-white/[.08] dark:sm:bg-white/[.035]",
    "sm:[&>button]:h-8 sm:[&>button]:w-auto sm:[&>button]:gap-1.5 sm:[&>button]:rounded-xl sm:[&>button]:px-3 sm:[&>button]:text-xs sm:[&>button]:font-semibold",
    "sm:[&>button:first-child]:text-[var(--muted)] sm:[&>button:first-child:hover]:bg-black/[.04] sm:[&>button:first-child:hover]:text-[var(--foreground)] dark:sm:[&>button:first-child:hover]:bg-white/[.06]",
    "sm:[&>button:last-child]:bg-red-500/10 sm:[&>button:last-child]:shadow-none sm:[&>button:last-child:hover]:bg-red-500/15",
    className,
  )}>{children}</div>;
}
