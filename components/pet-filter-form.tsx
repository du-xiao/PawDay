"use client";

import { useRef } from "react";
import { PawPrint } from "lucide-react";
import type { PetOption } from "@/lib/pets";
import { petOptionLabel } from "@/lib/pets";
import { cn } from "@/lib/utils";
import { selectClass } from "@/components/ui/form-field";

export function PetFilterForm({
  action,
  value,
  pets,
  allLabel = "全部宠物",
  hidden,
}: {
  action: string;
  value: string;
  pets: PetOption[];
  allLabel?: string;
  hidden?: Record<string, string | number | undefined>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={action} className="flex min-w-0" ref={formRef}>
      {hidden && Object.entries(hidden).map(([key, item]) => item ? <input key={key} type="hidden" name={key} value={item} /> : null)}
      <div className="relative min-w-0 flex-1 sm:w-48">
        <PawPrint className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <select
          name="pet"
          defaultValue={value}
          aria-label="宠物"
          onChange={() => formRef.current?.requestSubmit()}
          className={cn(selectClass, "h-9 rounded-xl border-0 bg-black/[.025] pl-10 pr-8 focus:ring-0 dark:bg-white/[.04]")}
        >
          <option value="">{allLabel}</option>
          {pets.map((pet) => <option key={pet.id} value={pet.id}>{petOptionLabel(pet)}</option>)}
        </select>
      </div>
      <button type="submit" className="sr-only">筛选宠物</button>
    </form>
  );
}
