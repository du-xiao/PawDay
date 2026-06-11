"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ensureDatabase } from "@/lib/bootstrap";
import { dogSchema, expenseSchema, healthSchema, logSchema, passwordSchema, photoSchema } from "@/lib/schemas";
import { saveImage } from "@/lib/upload";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function owner() {
  await ensureDatabase();
  const session = await auth();
  if (!session?.user?.id) throw new Error("登录已过期，请重新登录");
  return session.user.id;
}

async function dogId() {
  const dog = await prisma.dog.findFirst({ select: { id: true } });
  if (!dog) throw new Error("请先创建小狗档案");
  return dog.id;
}

function fail(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message || "提交内容有误" };
  return { ok: false, error: error instanceof Error ? error.message : "操作失败，请稍后再试" };
}

export async function saveDogAction(formData: FormData): Promise<ActionResult> {
  try {
    await owner();
    const current = await prisma.dog.findFirst();
    let avatarUrl = String(formData.get("avatarUrl") || current?.avatarUrl || "");
    const file = formData.get("avatar");
    if (file instanceof File && file.size) avatarUrl = await saveImage(file);
    const data = dogSchema.parse({
      name: formData.get("name"), breed: formData.get("breed"), sex: formData.get("sex"),
      birthDate: formData.get("birthDate"), adoptionDate: formData.get("adoptionDate"),
      weightKg: formData.get("weightKg") || undefined, avatarUrl,
    });
    const values = {
      name: data.name, breed: data.breed || null, sex: data.sex,
      birthDate: new Date(data.birthDate), adoptionDate: data.adoptionDate ? new Date(data.adoptionDate) : null,
      weightGrams: data.weightKg ? Math.round(Number(data.weightKg) * 1000) : null, avatarUrl: avatarUrl || null,
    };
    if (current) await prisma.dog.update({ where: { id: current.id }, data: values });
    else await prisma.dog.create({ data: values });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function saveLogAction(formData: FormData): Promise<ActionResult> {
  try {
    await owner();
    let imageUrl = String(formData.get("imageUrl") || "");
    const file = formData.get("image");
    if (file instanceof File && file.size) imageUrl = await saveImage(file);
    const data = logSchema.parse(Object.fromEntries(formData));
    const values = { type: data.type, title: data.title, notes: data.notes || null, occurredAt: new Date(data.occurredAt), mood: data.mood === "未记录" ? null : data.mood, imageUrl: imageUrl || null };
    if (data.id) await prisma.dailyLog.update({ where: { id: data.id }, data: values });
    else await prisma.dailyLog.create({ data: { ...values, dogId: await dogId() } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function deleteLogAction(id: string): Promise<ActionResult> {
  try { await owner(); await prisma.dailyLog.delete({ where: { id: z.string().cuid().parse(id) } }); revalidatePath("/", "layout"); return { ok: true }; } catch (error) { return fail(error); }
}

export async function saveExpenseAction(input: unknown): Promise<ActionResult> {
  try {
    await owner();
    const data = expenseSchema.parse(input);
    const values = { category: data.category, amountCents: Math.round(data.amount * 100), date: new Date(data.date), merchant: data.merchant || null, notes: data.notes || null };
    if (data.id) await prisma.expense.update({ where: { id: data.id }, data: values });
    else await prisma.expense.create({ data: { ...values, dogId: await dogId() } });
    revalidatePath("/", "layout"); return { ok: true };
  } catch (error) { return fail(error); }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try { await owner(); await prisma.expense.delete({ where: { id: z.string().cuid().parse(id) } }); revalidatePath("/", "layout"); return { ok: true }; } catch (error) { return fail(error); }
}

export async function saveHealthAction(input: unknown): Promise<ActionResult> {
  try {
    await owner();
    const data = healthSchema.parse(input);
    const values = { type: data.type, title: data.title, date: new Date(data.date), notes: data.notes || null, weightGrams: data.weightKg ? Math.round(Number(data.weightKg) * 1000) : null, nextReminderDate: data.nextReminderDate ? new Date(data.nextReminderDate) : null };
    if (data.id) await prisma.healthRecord.update({ where: { id: data.id }, data: values });
    else await prisma.healthRecord.create({ data: { ...values, dogId: await dogId() } });
    if (data.nextReminderDate) {
      const existing = data.id ? await prisma.reminder.findFirst({ where: { notes: `health:${data.id}` } }) : null;
      if (existing) await prisma.reminder.update({ where: { id: existing.id }, data: { title: `${data.title} · 下次提醒`, type: data.type, dueAt: new Date(data.nextReminderDate) } });
      else await prisma.reminder.create({ data: { dogId: await dogId(), title: `${data.title} · 下次提醒`, type: data.type, dueAt: new Date(data.nextReminderDate), notes: data.id ? `health:${data.id}` : null } });
    }
    revalidatePath("/", "layout"); return { ok: true };
  } catch (error) { return fail(error); }
}

export async function deleteHealthAction(id: string): Promise<ActionResult> {
  try { await owner(); await prisma.healthRecord.delete({ where: { id: z.string().cuid().parse(id) } }); revalidatePath("/", "layout"); return { ok: true }; } catch (error) { return fail(error); }
}

export async function savePhotoAction(formData: FormData): Promise<ActionResult> {
  try {
    await owner();
    const file = formData.get("image");
    if (!(file instanceof File) || !file.size) throw new Error("请选择一张图片");
    const data = photoSchema.parse(Object.fromEntries(formData));
    await prisma.photo.create({ data: { dogId: await dogId(), url: await saveImage(file), title: data.title || null, notes: data.notes || null, date: new Date(data.date), dailyLogId: data.dailyLogId || null } });
    revalidatePath("/", "layout"); return { ok: true };
  } catch (error) { return fail(error); }
}

export async function deletePhotoAction(id: string): Promise<ActionResult> {
  try { await owner(); await prisma.photo.delete({ where: { id: z.string().cuid().parse(id) } }); revalidatePath("/", "layout"); return { ok: true }; } catch (error) { return fail(error); }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await owner();
    const data = passwordSchema.parse(input);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(data.currentPassword, user.passwordHash))) throw new Error("当前密码不正确");
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(data.newPassword, 12) } });
    return { ok: true };
  } catch (error) { return fail(error); }
}
