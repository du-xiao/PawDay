"use client";

import { useRef } from "react";
import { Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { selectClass } from "@/components/ui/form-field";

export function LogFilterForm({ q, type, types }: { q: string; type: string; types: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} className="soft-card mb-5 rounded-2xl p-2 sm:mb-6 sm:rounded-3xl sm:p-4">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="relative rounded-xl bg-black/[.025] dark:bg-white/[.04] sm:rounded-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="搜索标题或备注"
            aria-label="搜索标题或备注"
            className="h-11 rounded-xl border-0 bg-transparent pl-11 focus:ring-0 sm:h-12 sm:rounded-2xl"
          />
        </div>
        <div className="relative rounded-xl bg-black/[.025] dark:bg-white/[.04] sm:rounded-2xl">
          <Filter className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <select
            name="type"
            defaultValue={type}
            aria-label="日常类型"
            onChange={() => formRef.current?.requestSubmit()}
            className={cn(selectClass, "h-11 rounded-xl border-0 bg-transparent pl-11 pr-9 focus:ring-0 sm:h-12 sm:rounded-2xl")}
          >
            <option value="">全部类型</option>
            {types.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" className="sr-only">搜索</button>
    </form>
  );
}
