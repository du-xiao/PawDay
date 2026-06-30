"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, CalendarDays, FileText, ImageIcon, ShieldCheck } from "lucide-react";
import type { PetDocumentType } from "@/lib/pets";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type DogDocumentView = {
  id: string;
  type: PetDocumentType;
  title: string | null;
  identifier: string | null;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  notes: string | null;
  updatedAt: string;
};

export function DogDocumentCard({ type, document, action }: { type: PetDocumentType; document?: DogDocumentView | null; action?: ReactNode }) {
  const status = getStatus(document?.expiresAt || null);

  if (!document) {
    return (
      <div className="soft-card rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <HeaderIcon type={type} />
          {action}
        </div>
        <div className="mt-5 rounded-2xl border border-dashed bg-white/35 p-5 text-center dark:bg-white/[.025]">
          <p className="text-sm font-semibold">{type}还没有记录</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">补充证件编号和正反面图片，以后需要时就不用临时翻相册。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="soft-card rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <HeaderIcon type={type} />
        {action}
      </div>
      <div className="mt-5">
        <p className="text-lg font-semibold tracking-tight">{document.title || type}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{document.identifier || "未填写证件编号"}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${status.className}`}>{status.label}</span>
          {document.issuer && <span className="rounded-full bg-black/[.04] px-2.5 py-1 text-[var(--muted)] dark:bg-white/[.055]">{document.issuer}</span>}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <MiniImage src={document.frontImageUrl} label="正面" />
        <MiniImage src={document.backImageUrl} label="反面" />
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-5 w-full bg-white/55 dark:bg-white/[.035]">
            查看详情
            <ArrowUpRight className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="dialog-scrollbar-hidden max-w-3xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>{document.title || type}</DialogTitle>
            <DialogDescription>证件信息和正反面图片会保存在上传目录里，随档案一起迁移。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border bg-black/[.018] p-4 dark:bg-white/[.025]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">证件资料</p>
              <DetailRow label="证件类型" value={type} />
              <DetailRow label="证件编号" value={document.identifier || "未填写"} />
              <DetailRow label="签发机构" value={document.issuer || "未填写"} />
              <DetailRow label="签发日期" value={document.issuedAt ? formatDate(document.issuedAt) : "未填写"} />
              <DetailRow label="有效期至" value={document.expiresAt ? formatDate(document.expiresAt) : "未填写"} />
              <DetailRow label="更新时间" value={formatDate(document.updatedAt)} />
              {document.notes && <div className="mt-4 rounded-2xl bg-white/55 p-3 text-sm leading-relaxed text-[var(--muted)] dark:bg-white/[.045]">{document.notes}</div>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <DocumentImage src={document.frontImageUrl} label="正面图片" />
              <DocumentImage src={document.backImageUrl} label="反面图片" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HeaderIcon({ type }: { type: PetDocumentType }) {
  const Icon = type === "免疫证" ? ShieldCheck : BadgeCheck;
  return (
    <div>
      <div className="grid size-11 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]">
        <Icon className="size-5" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[.18em] text-[var(--muted)]">{type}</p>
    </div>
  );
}

function MiniImage({ src, label }: { src?: string | null; label: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black/[.035] dark:bg-white/[.045]">
      {src ? <Image src={src} alt={label} fill unoptimized className="object-cover" sizes="160px" /> : <div className="grid h-full place-items-center text-[var(--muted)]"><ImageIcon className="size-5" /></div>}
      <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-[#2d2924] shadow-sm">{label}</span>
    </div>
  );
}

function DocumentImage({ src, label }: { src?: string | null; label: string }) {
  if (!src) {
    return (
      <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed bg-white/35 text-sm text-[var(--muted)] dark:bg-white/[.025]">
        暂未上传{label}
      </div>
    );
  }

  return (
    <a href={src} target="_blank" rel="noreferrer" className="group relative block min-h-48 overflow-hidden rounded-3xl border bg-black/[.035] dark:bg-white/[.045]">
      <Image src={src} alt={label} fill unoptimized className="object-cover transition duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 380px" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 text-sm font-semibold text-white">
        {label}
      </div>
    </a>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 text-sm last:border-b-0">
      <span className="flex items-center gap-2 text-[var(--muted)]">
        {label.includes("日期") || label.includes("时间") ? <CalendarDays className="size-3.5" /> : <FileText className="size-3.5" />}
        {label}
      </span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  );
}

function getStatus(expiresAt: string | null) {
  if (!expiresAt) return { label: "未设置有效期", className: "bg-stone-500/10 text-stone-600 dark:text-stone-300" };
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0) return { label: `已过期 ${Math.abs(daysLeft)} 天`, className: "bg-red-500/10 text-red-600 dark:text-red-300" };
  if (daysLeft <= 30) return { label: `${daysLeft} 天后到期`, className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" };
  return { label: "有效中", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
}
