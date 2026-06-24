"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { passwordSchema } from "@/lib/schemas";
import { changePasswordAction } from "@/actions/app";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/form-field";
import { FormActions } from "./shared";

type Values = z.infer<typeof passwordSchema>;

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function submit(values: Values) {
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result.ok) {
        toast.success("密码已修改，下次登录请使用新密码");
        reset();
      } else toast.error(result.error);
    });
  }

  return <form onSubmit={handleSubmit(submit)} className="space-y-4">
    <Field label="当前密码" error={errors.currentPassword?.message}><Input type="password" autoComplete="current-password" {...register("currentPassword")} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="新密码" error={errors.newPassword?.message}><Input type="password" autoComplete="new-password" {...register("newPassword")} /></Field>
      <Field label="再次输入" error={errors.confirmPassword?.message}><Input type="password" autoComplete="new-password" {...register("confirmPassword")} /></Field>
    </div>
    <FormActions pending={pending} submitLabel="修改密码" />
  </form>;
}
