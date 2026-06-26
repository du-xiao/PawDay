"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { logSchema } from "@/lib/schemas";
import { cn, toDateTimeInput } from "@/lib/utils";
import { saveLogAction } from "@/actions/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, selectClass } from "@/components/ui/form-field";
import { FormActions } from "./shared";
import { useImagePreview } from "./use-image-preview";

type Values = z.infer<typeof logSchema>;
const types = ["喂食", "遛狗", "洗澡", "排便", "睡眠", "训练", "情绪", "其他"] as const;
const moods = ["开心", "平静", "兴奋", "困倦", "不舒服", "未记录"] as const;
const compactControl = "h-10 rounded-xl";

export function LogForm({ initial, disabled = false }: { initial?: Values; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { previewUrl, setPreviewFile, resetPreview } = useImagePreview(initial?.imageUrl || "");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(logSchema),
    defaultValues: initial || { type: "遛狗", title: "", notes: "", occurredAt: toDateTimeInput(new Date()), mood: "开心", imageUrl: "" },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      resetPreview(initial?.imageUrl || "");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit(values: Values) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const file = fileRef.current?.files?.[0];
    if (file) formData.set("image", file);
    startTransition(async () => {
      const result = await saveLogAction(formData);
      if (result.ok) {
        toast.success(initial ? "记录已更新" : "今天又多了一段回忆");
        resetPreview(initial?.imageUrl || "");
        if (fileRef.current) fileRef.current.value = "";
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogTrigger asChild><Button variant={initial ? "ghost" : "warm"} size={initial ? "sm" : "default"} disabled={disabled}>{initial ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}{initial ? "编辑" : "记录今天"}</Button></DialogTrigger>
    <DialogContent className="dialog-scrollbar-hidden max-w-2xl p-5 sm:p-6">
      <DialogHeader className="mb-5"><DialogTitle>{initial ? "编辑日常记录" : "今天发生了什么？"}</DialogTitle><DialogDescription>不需要写很多，几个词也能留住这一天。</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <section className="rounded-2xl border bg-black/[.018] p-4 dark:bg-white/[.025]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">记录信息</p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)]">
            <Field label="类型"><select className={cn(selectClass, compactControl)} {...register("type")}>{types.map((type) => <option key={type}>{type}</option>)}</select></Field>
            <Field label="心情"><select className={cn(selectClass, compactControl)} {...register("mood")}>{moods.map((mood) => <option key={mood}>{mood}</option>)}</select></Field>
            <Field label="时间" error={errors.occurredAt?.message}><DateInput className={compactControl} type="datetime-local" {...register("occurredAt")} /></Field>
          </div>
          <Field label="标题" error={errors.title?.message} className="mt-3"><Input className={compactControl} placeholder="晚风里走了很远" {...register("title")} /></Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <Field label="备注"><Textarea className="min-h-24 rounded-2xl p-3.5" placeholder="记下一点细节…" {...register("notes")} /></Field>
          <div className="space-y-2">
            <span className="ml-1 block text-sm font-medium">照片</span>
            <button type="button" onClick={() => fileRef.current?.click()} className="relative flex min-h-28 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-white/40 px-4 text-center transition hover:border-orange-300 hover:bg-[var(--orange-soft)]/45 dark:bg-white/[.025]">
              {previewUrl ? <>
                <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${previewUrl})` }} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <span className="relative mt-auto rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-[#2d2924] shadow-lg">图片已选择，点击可更换</span>
              </> : <>
                <ImagePlus className="mb-2 size-5 text-[var(--orange)]" />
                <span className="text-xs font-medium">选择一张照片</span>
                <span className="mt-1 text-[10px] text-[var(--muted)]">JPG、PNG、WebP，最大 10MB</span>
              </>}
            </button>
            <Input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setPreviewFile(event.target.files?.[0])} />
          </div>
        </section>
        <FormActions pending={pending} className="mt-5 border-t pt-4" onCancel={() => setOpen(false)} />
      </form>
    </DialogContent>
  </Dialog>;
}
