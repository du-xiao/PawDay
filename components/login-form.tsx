"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { loginSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/form-field";

type Values = z.infer<typeof loginSchema>;

export function LoginForm() {
  const params = useSearchParams();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", remember: true } });

  async function onSubmit(values: Values) {
    setServerError("");
    const result = await signIn("credentials", { ...values, redirect: false });
    if (result?.error) { setServerError("邮箱或密码不正确，请再试一次。"); return; }
    window.location.href = params.get("callbackUrl") || "/";
  }

  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
    <Field label="邮箱" error={errors.email?.message}>
      <div className="relative"><Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" /><Input type="email" autoComplete="email" placeholder="owner@example.com" className="pl-11" {...register("email")} /></div>
    </Field>
    <Field label="密码" error={errors.password?.message}>
      <div className="relative"><LockKeyhole className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" /><Input type="password" autoComplete="current-password" placeholder="输入你的密码" className="pl-11" {...register("password")} /></div>
    </Field>
    <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--muted)]"><input type="checkbox" className="size-4 rounded accent-[var(--orange)]" {...register("remember")} />保持登录 30 天</label>
    {serverError && <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">{serverError}</p>}
    <Button type="submit" variant="warm" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : <>进入 PawDay <ArrowRight className="size-4" /></>}</Button>
  </form>;
}
