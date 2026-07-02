"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { expenseSchema } from "@/lib/schemas";
import { cn, toDateInput } from "@/lib/utils";
import { saveExpenseAction } from "@/actions/app";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, selectClass } from "@/components/ui/form-field";
import { FormActions } from "./shared";

type Values = z.infer<typeof expenseSchema>;
const categories = ["狗粮", "零食", "医疗", "洗护", "玩具", "用品", "保险", "寄养", "其他"] as const;
const compactControl = "h-10 rounded-xl";

type TriggerOptions = {
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
};

export function ExpenseForm({ initial, disabled = false, triggerLabel, triggerVariant, triggerSize, triggerClassName }: { initial?: Values; disabled?: boolean } & TriggerOptions) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initial || { category: "狗粮", itemName: "", amount: "" as unknown as Values["amount"], date: toDateInput(new Date()), merchant: "", notes: "" },
  });

  function submit(values: Values) {
    startTransition(async () => {
      const result = await saveExpenseAction(values);
      if (result.ok) {
        toast.success(initial ? "开销已更新" : "开销已记下");
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant={triggerVariant ?? (initial ? "ghost" : "warm")} size={triggerSize ?? (initial ? "sm" : "default")} className={triggerClassName} disabled={disabled}>{initial ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}{triggerLabel ?? (initial ? "编辑" : "记一笔")}</Button></DialogTrigger>
    <DialogContent className="dialog-scrollbar-hidden max-w-2xl p-5 sm:p-6">
      <DialogHeader className="mb-5"><DialogTitle>{initial ? "编辑开销" : "记录一笔开销"}</DialogTitle><DialogDescription>金额会以整数分保存，统计时更准确。</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <section className="rounded-2xl border bg-black/[.018] p-4 dark:bg-white/[.025]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">开销信息</p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
            <Field label="分类"><select className={cn(selectClass, compactControl)} {...register("category")}>{categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
            <Field label="金额（元）" error={errors.amount?.message}><Input className={compactControl} type="number" min="0.01" step="0.01" placeholder="128.00" {...register("amount")} /></Field>
            <Field label="日期"><DateInput className={compactControl} {...register("date")} /></Field>
          </div>
          <Field label="商品 / 项目" hint="可选，作为列表和日历里的标题" className="mt-3"><Input className={compactControl} placeholder="犬粮 10kg / 鸡肉冻干 / 体检套餐" {...register("itemName")} /></Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <Field label="备注"><Textarea className="min-h-28 rounded-2xl p-3.5" placeholder="规格、用量、优惠、下次回购提醒…" {...register("notes")} /></Field>
          <div className="rounded-2xl bg-[var(--sage-soft)]/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--sage)]"><ReceiptText className="size-4" /><span className="text-xs font-semibold">补充信息</span></div>
            <Field label="商家 / 渠道" hint="可选"><Input className={compactControl} placeholder="宠物店 / 医院 / 电商平台" {...register("merchant")} /></Field>
          </div>
        </section>
        <FormActions pending={pending} className="mt-5 border-t pt-4" onCancel={() => setOpen(false)} />
      </form>
    </DialogContent>
  </Dialog>;
}
