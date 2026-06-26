"use client";

import { useRef } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { selectClass } from "@/components/ui/form-field";

export function TypeFilterForm({
  action,
  name,
  value,
  options,
  allLabel,
  ariaLabel,
  hidden,
}: {
  action: string;
  name: string;
  value: string;
  options: readonly string[];
  allLabel: string;
  ariaLabel: string;
  hidden?: Record<string, string | number | undefined>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={action} className="flex min-w-0" ref={formRef}>
      {hidden && Object.entries(hidden).map(([key, item]) => item ? <input key={key} type="hidden" name={key} value={item} /> : null)}
      <div className="relative min-w-0 flex-1 sm:w-44">
        <Filter className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <select
          name={name}
          defaultValue={value}
          aria-label={ariaLabel}
          onChange={() => formRef.current?.requestSubmit()}
          className={cn(selectClass, "h-9 rounded-xl border-0 bg-black/[.025] pl-10 pr-8 focus:ring-0 dark:bg-white/[.04]")}
        >
          <option value="">{allLabel}</option>
          {options.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <button type="submit" className="sr-only">筛选</button>
    </form>
  );
}
