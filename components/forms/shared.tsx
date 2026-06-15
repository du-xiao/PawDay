"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/actions/app";

export function FormActions({ pending, submitLabel = "保存记录", onCancel, className }: { pending: boolean; submitLabel?: string; onCancel?: () => void; className?: string }) {
  return <div className={cn("mt-7 flex justify-end gap-3",className)}>{onCancel && <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>}<Button type="submit" variant="warm" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{submitLabel}</Button></div>;
}

export function DeleteButton({ action, label = "删除" }: { action: () => Promise<ActionResult>; label?: string }) {
  const [pending, startTransition] = useTransition();
  return <Button type="button" size="sm" variant="danger" disabled={pending} onClick={() => { if (!window.confirm("确定删除这条记录吗？此操作无法撤销。")) return; startTransition(async () => { const result = await action(); if (result.ok) toast.success("已删除"); else toast.error(result.error); }); }}>{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}{label}</Button>;
}

export function RecordActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(
    "flex shrink-0 items-center gap-0.5 rounded-xl bg-black/[.035] p-0.5 dark:bg-white/[.05]",
    "[&>button]:size-8 [&>button]:gap-0 [&>button]:rounded-lg [&>button]:px-0 [&>button]:text-[0px] [&>button>svg]:size-3.5",
    "sm:gap-0 sm:bg-transparent sm:p-0 sm:[&>button]:h-9 sm:[&>button]:w-auto sm:[&>button]:gap-2 sm:[&>button]:rounded-xl sm:[&>button]:px-3.5 sm:[&>button]:text-sm",
    className,
  )}>{children}</div>;
}
