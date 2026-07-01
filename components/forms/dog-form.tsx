"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { dogSchema } from "@/lib/schemas";
import { saveDogAction } from "@/actions/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, selectClass } from "@/components/ui/form-field";
import { FormActions } from "./shared";
import { useImagePreview } from "./use-image-preview";

type Values = z.infer<typeof dogSchema>;
type DogValue = { name: string; breed: string; sex: "男孩" | "女孩" | "未知"; birthDate: string; adoptionDate: string; weightKg: number | ""; avatarUrl: string };

export function DogForm({ dog, onboarding = false, triggerClassName }: { dog?: DogValue; onboarding?: boolean; triggerClassName?: string }) {
  const [open, setOpen] = useState(onboarding);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { previewUrl, setPreviewFile, resetPreview } = useImagePreview(dog?.avatarUrl || "");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(dogSchema), defaultValues: dog || { name: "", breed: "", sex: "未知", birthDate: "", adoptionDate: "", weightKg: "", avatarUrl: "" } });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      resetPreview(dog?.avatarUrl || "");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit(values: Values) {
    const fd = new FormData(); Object.entries(values).forEach(([k,v]) => fd.set(k, String(v ?? "")));
    const file = fileRef.current?.files?.[0]; if (file) fd.set("avatar", file);
    startTransition(async () => { const result = await saveDogAction(fd); if (result.ok) { toast.success(dog ? "档案已更新" : "欢迎加入 PawDay"); resetPreview(dog?.avatarUrl || ""); if (fileRef.current) fileRef.current.value = ""; setOpen(false); router.refresh(); } else toast.error(result.error); });
  }

  return <Dialog open={open} onOpenChange={handleOpenChange}><DialogTrigger asChild><Button variant={onboarding ? "warm" : "outline"} className={triggerClassName}><Camera className="size-4" />{dog ? "编辑档案" : "创建小狗档案"}</Button></DialogTrigger><DialogContent>
    <DialogHeader><DialogTitle>{dog ? "编辑小狗档案" : "先认识一下新朋友"}</DialogTitle><DialogDescription>这些信息会用来计算年龄、陪伴天数和健康趋势。</DialogDescription></DialogHeader>
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="头像" hint="JPG、PNG 或 WebP，最大 10MB">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative flex min-h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-white/45 px-4 text-center transition hover:border-orange-300 hover:bg-[var(--orange-soft)]/45 dark:bg-white/[.025]">
          {previewUrl ? <>
            <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${previewUrl})` }} />
            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <span className="relative mt-auto rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#2d2924] shadow-lg">头像已选择，点击可更换</span>
          </> : <>
            <Camera className="mb-2 size-5 text-[var(--orange)]" />
            <span className="text-sm font-semibold">选择头像</span>
          </>}
        </button>
        <Input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setPreviewFile(event.target.files?.[0])} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="名字" error={errors.name?.message}><Input placeholder="例如：奶糖" {...register("name")} /></Field><Field label="品种" error={errors.breed?.message}><Input placeholder="例如：比熊" {...register("breed")} /></Field></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="性别"><select className={selectClass} {...register("sex")}><option>男孩</option><option>女孩</option><option>未知</option></select></Field><Field label="当前体重（kg）" error={errors.weightKg?.message as string}><Input type="number" step="0.01" placeholder="5.20" {...register("weightKg")} /></Field></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="生日" error={errors.birthDate?.message}><DateInput {...register("birthDate")} /></Field><Field label="来到家的日子"><DateInput {...register("adoptionDate")} /></Field></div>
      <FormActions pending={pending} submitLabel={dog ? "保存修改" : "创建档案"} onCancel={() => setOpen(false)} />
    </form>
  </DialogContent></Dialog>;
}
