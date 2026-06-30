"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BellRing, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { healthSchema } from "@/lib/schemas";
import { cn, toDateInput } from "@/lib/utils";
import { saveHealthAction } from "@/actions/app";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, selectClass } from "@/components/ui/form-field";
import { FormActions } from "./shared";

type Values = z.infer<typeof healthSchema>;
const types = ["疫苗", "驱虫", "体检", "用药", "疾病", "绝育", "体重"] as const;
const defaultTitles: Record<Values["type"], string> = {
  疫苗: "疫苗接种",
  驱虫: "体内外驱虫",
  体检: "健康体检",
  用药: "用药记录",
  疾病: "病情记录",
  绝育: "绝育手术",
  体重: "日常称重",
};
const compactControl = "h-10 rounded-xl";

type TriggerOptions = {
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
};

export function HealthForm({ initial, disabled = false, triggerLabel, triggerVariant, triggerSize, triggerClassName }: { initial?: Values; disabled?: boolean } & TriggerOptions) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, formState: { errors, dirtyFields } } = useForm<Values>({
    resolver: zodResolver(healthSchema),
    defaultValues: initial || { type: "体重", title: defaultTitles.体重, date: toDateInput(new Date()), notes: "", weightKg: "", nextReminderDate: "" },
  });
  const type = watch("type");

  useEffect(() => {
    if (!initial && !dirtyFields.title) setValue("title", defaultTitles[type], { shouldValidate: true });
  }, [dirtyFields.title, initial, setValue, type]);

  function submit(values: Values) {
    startTransition(async () => {
      const result = await saveHealthAction(values);
      if (result.ok) {
        toast.success(initial ? "健康记录已更新" : "健康记录已保存");
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  const showWeight = type === "体重" || Boolean(initial?.weightKg);

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant={triggerVariant ?? (initial ? "ghost" : "warm")} size={triggerSize ?? (initial ? "sm" : "default")} className={triggerClassName} disabled={disabled}>{initial ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}{triggerLabel ?? (initial ? "编辑" : "新增健康记录")}</Button></DialogTrigger>
    <DialogContent className="dialog-scrollbar-hidden max-w-2xl p-5 sm:p-6">
      <DialogHeader className="mb-5"><DialogTitle>{initial ? "编辑健康记录" : "新增健康记录"}</DialogTitle><DialogDescription>重要日期和下一次提醒会一起出现在首页。</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <section className="rounded-2xl border bg-black/[.018] p-4 dark:bg-white/[.025]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">基础信息</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="类型"><select className={cn(selectClass, compactControl)} {...register("type")}>{types.map((type) => <option key={type}>{type}</option>)}</select></Field>
            <Field label="日期"><DateInput className={compactControl} {...register("date")} /></Field>
          </div>
          <div className={showWeight ? "mt-3 grid gap-3 sm:grid-cols-[1fr_180px]" : "mt-3"}>
            <Field label="标题" error={errors.title?.message}><Input className={compactControl} placeholder="记录标题" {...register("title")} /></Field>
            {showWeight && <Field label="体重（kg）"><Input className={compactControl} type="number" step="0.01" placeholder="5.20" {...register("weightKg")} /></Field>}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <Field label="备注"><Textarea className="min-h-28 rounded-2xl p-3.5" placeholder="医院、剂量、医生建议…" {...register("notes")} /></Field>
          <div className="rounded-2xl bg-[var(--orange-soft)]/55 p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--orange)]"><BellRing className="size-4" /><span className="text-xs font-semibold">下次提醒</span></div>
            <Field label="提醒日期" hint="可选"><DateInput className={compactControl} {...register("nextReminderDate")} /></Field>
          </div>
        </section>
        <FormActions pending={pending} className="mt-5 border-t pt-4" onCancel={() => setOpen(false)} />
      </form>
    </DialogContent>
  </Dialog>;
}
