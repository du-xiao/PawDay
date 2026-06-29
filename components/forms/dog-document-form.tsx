"use client";

import { useRef, useState, useTransition, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveDogDocumentAction } from "@/actions/app";
import { dogDocumentSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormActions } from "./shared";
import { useImagePreview } from "./use-image-preview";

type Values = z.infer<typeof dogDocumentSchema>;
type DocumentType = Values["type"];

export type DogDocumentFormValue = Values & {
  frontImageUrl?: string;
  backImageUrl?: string;
};

type TriggerOptions = {
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
};

export function DogDocumentForm({ type, initial, triggerLabel, triggerVariant, triggerSize, triggerClassName }: { type: DocumentType; initial?: DogDocumentFormValue } & TriggerOptions) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const frontPreview = useImagePreview(initial?.frontImageUrl || "");
  const backPreview = useImagePreview(initial?.backImageUrl || "");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(dogDocumentSchema),
    defaultValues: initial || { type, title: type, identifier: "", issuer: "", issuedAt: "", expiresAt: "", notes: "" },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetFileInputs();
  }

  function resetFileInputs() {
    frontPreview.resetPreview(initial?.frontImageUrl || "");
    backPreview.resetPreview(initial?.backImageUrl || "");
    if (frontRef.current) frontRef.current.value = "";
    if (backRef.current) backRef.current.value = "";
  }

  function submit(values: Values) {
    const formData = new FormData();
    Object.entries({ ...values, type }).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const frontFile = frontRef.current?.files?.[0];
    const backFile = backRef.current?.files?.[0];
    if (frontFile) formData.set("frontImage", frontFile);
    if (backFile) formData.set("backImage", backFile);

    startTransition(async () => {
      const result = await saveDogDocumentAction(formData);
      if (result.ok) {
        toast.success(`${type}已保存`);
        resetFileInputs();
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant ?? (initial ? "ghost" : "outline")} size={triggerSize ?? "sm"} className={triggerClassName}>
          {initial ? <Pencil className="size-3.5" /> : <Plus className="size-3.5" />}
          {triggerLabel ?? (initial ? `编辑${type}` : `新增${type}`)}
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog-scrollbar-hidden max-w-2xl p-5 sm:p-6">
        <DialogHeader className="mb-5">
          <DialogTitle>{initial ? `编辑${type}` : `新增${type}`}</DialogTitle>
          <DialogDescription>记录证件编号、签发信息，并保存正反面图片，之后在档案里可以随时查看。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <input type="hidden" value={type} {...register("type")} />
          <section className="rounded-2xl border bg-black/[.018] p-4 dark:bg-white/[.025]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">证件信息</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="证件名称" error={errors.title?.message}><Input placeholder={type} {...register("title")} /></Field>
              <Field label="证件编号" error={errors.identifier?.message}><Input placeholder="可填写编号或登记号" {...register("identifier")} /></Field>
              <Field label="签发机构" error={errors.issuer?.message}><Input placeholder="例如：当地养犬登记机构" {...register("issuer")} /></Field>
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                <Field label="签发日期" error={errors.issuedAt?.message}><DateInput {...register("issuedAt")} /></Field>
                <Field label="有效期至" error={errors.expiresAt?.message}><DateInput {...register("expiresAt")} /></Field>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <Field label="备注" error={errors.notes?.message}>
              <Textarea className="min-h-36 rounded-2xl p-3.5" placeholder="例如办理地址、补办方式、需要注意的事项…" {...register("notes")} />
            </Field>
            <div className="space-y-3">
              <ImagePicker label="正面图片" previewUrl={frontPreview.previewUrl} inputRef={frontRef} onChange={frontPreview.setPreviewFile} />
              <ImagePicker label="反面图片" previewUrl={backPreview.previewUrl} inputRef={backRef} onChange={backPreview.setPreviewFile} />
            </div>
          </section>

          <FormActions pending={pending} submitLabel="保存证件" className="mt-5 border-t pt-4" onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImagePicker({ label, previewUrl, inputRef, onChange }: { label: string; previewUrl: string; inputRef: RefObject<HTMLInputElement | null>; onChange: (file?: File | null) => void }) {
  return (
    <div className="space-y-2">
      <span className="ml-1 block text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex min-h-32 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-white/40 px-4 text-center transition",
          "hover:border-orange-300 hover:bg-[var(--orange-soft)]/45 dark:bg-white/[.025]",
        )}
      >
        {previewUrl ? <>
          <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${previewUrl})` }} />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <span className="relative mt-auto rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-[#2d2924] shadow-lg">图片已选择，点击可更换</span>
        </> : <>
          <ImagePlus className="mb-2 size-5 text-[var(--orange)]" />
          <span className="text-xs font-medium">上传{label}</span>
          <span className="mt-1 text-[10px] text-[var(--muted)]">JPG、PNG、WebP，最大 10MB</span>
        </>}
      </button>
      <Input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => onChange(event.target.files?.[0])} />
    </div>
  );
}
