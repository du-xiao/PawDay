"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saveGuestAccountAction } from "@/actions/app";
import { guestAccountSchema } from "@/lib/schemas";
import { Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { FormActions } from "./shared";

type Values = z.infer<typeof guestAccountSchema>;

export type GuestAccountValue = {
  enabled: boolean;
  email: string;
  exists: boolean;
};

export function GuestAccountForm({ guest }: { guest: GuestAccountValue }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(guestAccountSchema),
    defaultValues: { enabled: guest.enabled, email: guest.email, password: "" },
  });
  const enabled = watch("enabled");

  function submit(values: Values) {
    startTransition(async () => {
      const result = await saveGuestAccountAction(values);
      if (result.ok) {
        toast.success(values.enabled ? "访客账号已保存" : "访客账号已停用");
        reset({ enabled: values.enabled, email: values.email, password: "" });
      } else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <label className="flex items-start gap-3 rounded-2xl border bg-white/45 p-4 text-sm dark:bg-white/[.035]">
        <input type="checkbox" className="mt-0.5 size-4 rounded border accent-[var(--orange)]" {...register("enabled")} />
        <span>
          <span className="block font-semibold">启用访客只读账号</span>
          <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">访客可以查看所有档案、记录和照片，但不能新增、编辑、删除或修改密码。</span>
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="访客邮箱" error={errors.email?.message}>
          <Input type="email" autoComplete="off" placeholder="guest@example.com" disabled={!enabled} {...register("email")} />
        </Field>
        <Field label={guest.exists ? "访客密码（留空不修改）" : "访客密码"} error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" placeholder={guest.exists ? "留空则保持原密码" : "至少 8 位"} disabled={!enabled} {...register("password")} />
        </Field>
      </div>
      <FormActions pending={pending} submitLabel="保存访客设置" />
    </form>
  );
}
