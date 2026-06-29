"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { cancelReminderAction, completeReminderAction } from "@/actions/app";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    <div className={cn("flex flex-wrap justify-end gap-2", className)}>
      <Button type="button" size="sm" variant="warm" disabled={pending} onClick={() => run("complete")}>
        <Check className="size-3.5" />
        完成
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run("cancel")} className="text-[var(--muted)] hover:text-red-600 dark:hover:text-red-300">
        <X className="size-3.5" />
        取消提醒
      </Button>
    </div>
  );
}
