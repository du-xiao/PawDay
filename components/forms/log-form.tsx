"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { logSchema } from "@/lib/schemas";
import { toDateTimeInput } from "@/lib/utils";
import { saveLogAction } from "@/actions/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, selectClass } from "@/components/ui/form-field";
import { FormActions } from "./shared";

type Values = z.infer<typeof logSchema>;
const types = ["喂食", "遛狗", "洗澡", "排便", "睡眠", "训练", "情绪", "其他"] as const;
const moods = ["开心", "平静", "兴奋", "困倦", "不舒服", "未记录"] as const;

export function LogForm({ initial, disabled = false }: { initial?: Values; disabled?: boolean }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const fileRef = useRef<HTMLInputElement>(null); const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(logSchema), defaultValues: initial || { type: "遛狗", title: "", notes: "", occurredAt: toDateTimeInput(new Date()), mood: "开心", imageUrl: "" } });
  function submit(values: Values) { const fd = new FormData(); Object.entries(values).forEach(([k,v]) => fd.set(k, String(v ?? ""))); const file=fileRef.current?.files?.[0]; if(file) fd.set("image",file); startTransition(async()=>{const r=await saveLogAction(fd);if(r.ok){toast.success(initial?"记录已更新":"今天又多了一段回忆");setOpen(false);router.refresh();}else toast.error(r.error);}); }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant={initial?"ghost":"warm"} size={initial?"sm":"default"} disabled={disabled}>{initial?<Pencil className="size-3.5"/>:<Plus className="size-4"/>}{initial?"编辑":"记录今天"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{initial?"编辑日常记录":"今天发生了什么？"}</DialogTitle><DialogDescription>不需要写很多，几个词也能留住这一天。</DialogDescription></DialogHeader><form onSubmit={handleSubmit(submit)} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="类型"><select className={selectClass} {...register("type")}>{types.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="心情"><select className={selectClass} {...register("mood")}>{moods.map(x=><option key={x}>{x}</option>)}</select></Field></div>
    <Field label="标题" error={errors.title?.message}><Input placeholder="晚风里走了很远" {...register("title")}/></Field><Field label="时间" error={errors.occurredAt?.message}><Input type="datetime-local" {...register("occurredAt")}/></Field><Field label="备注"><Textarea placeholder="记下一点细节…" {...register("notes")}/></Field><Field label="照片" hint="可选，最大 10MB"><Input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="pt-3"/></Field><FormActions pending={pending} onCancel={()=>setOpen(false)}/>
  </form></DialogContent></Dialog>;
}
