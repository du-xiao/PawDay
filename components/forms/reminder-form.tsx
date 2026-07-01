"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BellPlus, Pencil, Plus, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { reminderSchema } from "@/lib/schemas";
import { cn, toDateInput } from "@/lib/utils";
import { saveReminderAction } from "@/actions/app";
import { Button, type ButtonProps } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Field, selectClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormActions } from "./shared";

type Values = z.infer<typeof reminderSchema>;
const reminderTypes = ["疫苗", "驱虫", "体检", "用药", "洗澡", "买粮", "美容", "保险", "证件", "其他"] as const;
const repeatUnits = ["不重复", "天", "周", "月", "年"] as const;
const compactControl = "h-10 rounded-xl";

const defaultTitles: Record<Values["type"], string> = {
  疫苗: "疫苗提醒",
  驱虫: "驱虫提醒",
  体检: "体检提醒",
  用药: "用药提醒",
  洗澡: "洗澡提醒",
  买粮: "买粮提醒",
  美容: "美容预约",
  保险: "保险续费",
  证件: "证件更新",
  其他: "新的提醒",
};

type TriggerOptions = {
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
};

export function ReminderForm({ initial, disabled = false, triggerLabel, triggerVariant, triggerSize, triggerClassName }: { initial?: Values; disabled?: boolean } & TriggerOptions) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, formState: { errors, dirtyFields } } = useForm<Values>({
    resolver: zodResolver(reminderSchema),
    defaultValues: initial || { type: "驱虫", title: defaultTitles.驱虫, dueAt: toDateInput(new Date()), repeatUnit: "不重复", repeatInterval: "", notes: "" },
  });
  const type = watch("type");
  const repeatUnit = watch("repeatUnit");

  useEffect(() => {
    if (!initial && !dirtyFields.title) setValue("title", defaultTitles[type], { shouldValidate: true });
  }, [dirtyFields.title, initial, setValue, type]);

  function submit(values: Values) {
    startTransition(async () => {
      const result = await saveReminderAction(values);
      if (result.ok) {
        toast.success(initial ? "提醒已更新" : "提醒已保存");
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant ?? (initial ? "ghost" : "warm")} size={triggerSize ?? (initial ? "sm" : "default")} className={triggerClassName} disabled={disabled}>
          {initial ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}
          {triggerLabel ?? (initial ? "编辑" : "新增提醒")}
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog-scrollbar-hidden max-w-2xl p-5 sm:p-6">
        <DialogHeader className="mb-5">
          <DialogTitle>{initial ? "编辑提醒" : "新增提醒"}</DialogTitle>
          <DialogDescription>把驱虫、洗澡、买粮这类固定节奏交给 PawDay 记着。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <section className="rounded-2xl border bg-black/[.018] p-4 dark:bg-white/[.025]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">提醒信息</p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
              <Field label="类型"><select className={cn(selectClass, compactControl)} {...register("type")}>{reminderTypes.map((item) => <option key={item}>{item}</option>)}</select></Field>
              <Field label="标题" error={errors.title?.message}><Input className={compactControl} placeholder="提醒标题" {...register("title")} /></Field>
              <Field label="到期日期" error={errors.dueAt?.message}><DateInput className={compactControl} {...register("dueAt")} /></Field>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-[1fr_230px]">
            <Field label="备注"><Textarea className="min-h-28 rounded-2xl p-3.5" placeholder="剂量、地址、需要准备的东西…" {...register("notes")} /></Field>
            <div className="rounded-2xl bg-[var(--sage-soft)]/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-[var(--sage)]"><Repeat2 className="size-4" /><span className="text-xs font-semibold">重复规则</span></div>
              <div className="grid gap-3">
                <Field label="频率"><select className={cn(selectClass, compactControl)} {...register("repeatUnit")}>{repeatUnits.map((item) => <option key={item}>{item}</option>)}</select></Field>
                {repeatUnit !== "不重复" && <Field label={`每隔多少${repeatUnit}`} error={errors.repeatInterval?.message}><Input className={compactControl} type="number" min="1" step="1" placeholder="1" {...register("repeatInterval")} /></Field>}
              </div>
            </div>
          </section>
          <div className="rounded-2xl bg-[var(--orange-soft)]/45 px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
            <BellPlus className="mr-1 inline size-3.5 text-[var(--orange)]" />
            重复提醒点“完成”后会自动生成下一次到期日期；不重复提醒会进入已完成。
          </div>
          <FormActions pending={pending} className="mt-5 border-t pt-4" onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
