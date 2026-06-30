"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import type { PetOption } from "@/lib/pets";
import { petOptionLabel } from "@/lib/pets";
import { Field, selectClass } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

export function PetSelectField({
  pets,
  registration,
  disabled = false,
  className,
}: {
  pets: PetOption[];
  registration: UseFormRegisterReturn;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Field label="宠物" className={className}>
      <select className={cn(selectClass, "h-10 rounded-xl")} disabled={disabled} {...registration}>
        {pets.map((pet) => <option key={pet.id} value={pet.id}>{petOptionLabel(pet)}</option>)}
      </select>
    </Field>
  );
}
