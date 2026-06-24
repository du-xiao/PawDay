"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { photoSchema } from "@/lib/schemas";
import { savePhotoAction } from "@/actions/app";
import { cn, toDateInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, selectClass } from "@/components/ui/form-field";
import { FormActions } from "./shared";

type Values = z.infer<typeof photoSchema>;
const compactControl = "h-10 rounded-xl";

export function PhotoForm({ logs, disabled = false }: { logs: { id: string; title: string }[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(photoSchema),
    defaultValues: { title: "", notes: "", date: toDateInput(new Date()), dailyLogId: "" },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit(values: Values) {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("请选择一张图片");
      return;
    }
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    formData.set("image", file);
    startTransition(async () => {
      const result = await savePhotoAction(formData);
      if (result.ok) {
        toast.success("照片已收进回忆里");
        if (fileRef.current) fileRef.current.value = "";
        setFileName("");
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogTrigger asChild><Button variant="warm" disabled={disabled}><ImagePlus className="size-4" />上传照片</Button></DialogTrigger>
    <DialogContent className="dialog-scrollbar-hidden max-w-2xl p-5 sm:p-6">
      <DialogHeader className="mb-5"><DialogTitle>收藏一个瞬间</DialogTitle><DialogDescription>支持 JPG、PNG、WebP，单张最大 10MB。</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <section className="rounded-2xl border bg-black/[.018] p-4 dark:bg-white/[.025]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">照片信息</p>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-white/45 px-4 text-center transition hover:border-orange-300 hover:bg-[var(--orange-soft)]/45 dark:bg-white/[.025]">
            <Plus className="mb-2 size-5 text-[var(--orange)]" />
            <span className="text-sm font-semibold">{fileName || "选择一张照片"}</span>
            <span className="mt-1 text-xs text-[var(--muted)]">JPG、PNG、WebP，最大 10MB</span>
          </button>
          <Input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="标题"><Input className={compactControl} placeholder="今天的好天气" {...register("title")} /></Field>
            <Field label="日期" error={errors.date?.message}><DateInput className={compactControl} {...register("date")} /></Field>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <div className="rounded-2xl bg-[var(--orange-soft)]/55 p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--orange)]"><Link2 className="size-4" /><span className="text-xs font-semibold">关联记录</span></div>
            <Field label="日常记录"><select className={cn(selectClass, compactControl)} {...register("dailyLogId")}><option value="">不关联</option>{logs.map((log) => <option key={log.id} value={log.id}>{log.title}</option>)}</select></Field>
          </div>
          <Field label="备注"><Textarea className="min-h-28 rounded-2xl p-3.5" placeholder="这一刻为什么特别…" {...register("notes")} /></Field>
        </section>
        <FormActions pending={pending} className="mt-5 border-t pt-4" onCancel={() => setOpen(false)} />
      </form>
    </DialogContent>
  </Dialog>;
}
