"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { expenseSchema } from "@/lib/schemas";
import { toDateInput } from "@/lib/utils";
import { saveExpenseAction } from "@/actions/app";
import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Textarea } from "@/components/ui/textarea";
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger } from "@/components/ui/dialog"; import { Field,selectClass } from "@/components/ui/form-field"; import { FormActions } from "./shared";
type Values=z.infer<typeof expenseSchema>; const categories=["狗粮","零食","医疗","洗护","玩具","用品","保险","寄养","其他"] as const;
export function ExpenseForm({initial,disabled=false}:{initial?:Values;disabled?:boolean}){const[open,setOpen]=useState(false);const[pending,startTransition]=useTransition();const router=useRouter();const{register,handleSubmit,formState:{errors}}=useForm<Values>({resolver:zodResolver(expenseSchema),defaultValues:initial||{category:"狗粮",amount:0,date:toDateInput(new Date()),merchant:"",notes:""}});function submit(v:Values){startTransition(async()=>{const r=await saveExpenseAction(v);if(r.ok){toast.success(initial?"开销已更新":"开销已记下");setOpen(false);router.refresh();}else toast.error(r.error);});}return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant={initial?"ghost":"warm"} size={initial?"sm":"default"} disabled={disabled}>{initial?<Pencil className="size-3.5"/>:<Plus className="size-4"/>}{initial?"编辑":"记一笔"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{initial?"编辑开销":"记录一笔开销"}</DialogTitle><DialogDescription>金额会以整数分保存，避免浮点误差。</DialogDescription></DialogHeader><form onSubmit={handleSubmit(submit)} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="分类"><select className={selectClass} {...register("category")}>{categories.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="金额（元）" error={errors.amount?.message}><Input type="number" min="0.01" step="0.01" {...register("amount")}/></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="日期"><Input type="date" {...register("date")}/></Field><Field label="商家"><Input placeholder="可选" {...register("merchant")}/></Field></div><Field label="备注"><Textarea placeholder="买了什么，为什么买…" {...register("notes")}/></Field><FormActions pending={pending} onCancel={()=>setOpen(false)}/></form></DialogContent></Dialog>}
