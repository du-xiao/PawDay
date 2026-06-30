"use server";

import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ensureDatabase } from "@/lib/bootstrap";
import { dogDocumentSchema, dogSchema, expenseSchema, guestAccountSchema, healthSchema, logSchema, passwordSchema, photoSchema } from "@/lib/schemas";
import { syncDailyLogImagePhoto } from "@/lib/photo-sync";
import { USER_ROLES, normalizeRole } from "@/lib/roles";
import { deleteImage, saveImage } from "@/lib/upload";
import { normalizeSpecies } from "@/lib/pets";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  await ensureDatabase();
  const session = await auth();
  if (!session?.user?.id) throw new Error("登录已过期，请重新登录");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, disabledAt: true },
  });
  if (!user || user.disabledAt) throw new Error("账号不可用，请重新登录");
  return user;
}

async function requireOwner() {
  const user = await requireUser();
  if (normalizeRole(user.role) !== USER_ROLES.OWNER) throw new Error("访客账号仅可查看，不能新增、修改或删除数据");
  return user.id;
}

async function petId(id?: string | null) {
  if (id) {
    const pet = await prisma.dog.findUnique({ where: { id }, select: { id: true } });
    if (!pet) throw new Error("选择的宠物档案不存在");
    return pet.id;
  }
  const pet = await prisma.dog.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
  if (!pet) throw new Error("请先创建宠物档案");
  return pet.id;
}

function fail(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message || "提交内容有误" };
  return { ok: false, error: error instanceof Error ? error.message : "操作失败，请稍后再试" };
}

function inputDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) throw new Error("日期格式不正确，请重新选择");
  return date;
}

function optionalInputDate(value?: string) {
  return value ? inputDate(value) : null;
}

type DogDocumentRow = {
  id: string;
  dogId: string;
  type: string;
  title: string | null;
  identifier: string | null;
  issuer: string | null;
  issuedAt: Date | string | null;
  expiresAt: Date | string | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function saveDogAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const data = dogSchema.parse({
      id: formData.get("id") || undefined, species: formData.get("species") || "DOG",
      name: formData.get("name"), breed: formData.get("breed"), sex: formData.get("sex"),
      birthDate: formData.get("birthDate"), adoptionDate: formData.get("adoptionDate"),
      weightKg: formData.get("weightKg") || undefined, avatarUrl: formData.get("avatarUrl") || "",
    });
    const current = data.id ? await prisma.dog.findUnique({ where: { id: data.id } }) : null;
    if (data.id && !current) throw new Error("要编辑的宠物档案不存在");
    const file = formData.get("avatar");
    const uploadedUrl = file instanceof File && file.size ? await saveImage(file) : null;
    const avatarUrl = uploadedUrl || current?.avatarUrl || null;
    const values = {
      species: normalizeSpecies(data.species), name: data.name, breed: data.breed || null, sex: data.sex,
      birthDate: inputDate(data.birthDate), adoptionDate: data.adoptionDate ? inputDate(data.adoptionDate) : null,
      weightGrams: data.weightKg ? Math.round(Number(data.weightKg) * 1000) : null, avatarUrl,
    };
    try {
      if (current) await prisma.dog.update({ where: { id: current.id }, data: values });
      else await prisma.dog.create({ data: values });
    } catch (error) {
      if (uploadedUrl) await deleteImage(uploadedUrl);
      throw error;
    }
    if (uploadedUrl && current?.avatarUrl) await deleteImage(current.avatarUrl);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function saveDogDocumentAction(formData: FormData): Promise<ActionResult> {
  let uploadedFrontUrl: string | null = null;
  let uploadedBackUrl: string | null = null;

  try {
    await requireOwner();
    const data = dogDocumentSchema.parse({
      dogId: formData.get("dogId") || undefined,
      type: formData.get("type"),
      title: formData.get("title"),
      identifier: formData.get("identifier"),
      issuer: formData.get("issuer"),
      issuedAt: formData.get("issuedAt"),
      expiresAt: formData.get("expiresAt"),
      notes: formData.get("notes"),
    });
    const currentDogId = await petId(data.dogId);
    const [current] = await prisma.$queryRaw<DogDocumentRow[]>`
      SELECT * FROM "DogDocument" WHERE "dogId" = ${currentDogId} AND "type" = ${data.type} LIMIT 1
    `;
    const frontFile = formData.get("frontImage");
    const backFile = formData.get("backImage");
    uploadedFrontUrl = frontFile instanceof File && frontFile.size ? await saveImage(frontFile) : null;
    uploadedBackUrl = backFile instanceof File && backFile.size ? await saveImage(backFile) : null;
    const values = {
      title: data.title || null,
      identifier: data.identifier || null,
      issuer: data.issuer || null,
      issuedAt: optionalInputDate(data.issuedAt),
      expiresAt: optionalInputDate(data.expiresAt),
      frontImageUrl: uploadedFrontUrl || current?.frontImageUrl || null,
      backImageUrl: uploadedBackUrl || current?.backImageUrl || null,
      notes: data.notes || null,
    };

    if (current) {
      await prisma.$executeRaw`
        UPDATE "DogDocument"
        SET "title" = ${values.title},
            "identifier" = ${values.identifier},
            "issuer" = ${values.issuer},
            "issuedAt" = ${values.issuedAt},
            "expiresAt" = ${values.expiresAt},
            "frontImageUrl" = ${values.frontImageUrl},
            "backImageUrl" = ${values.backImageUrl},
            "notes" = ${values.notes},
            "updatedAt" = ${new Date()}
        WHERE "id" = ${current.id}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "DogDocument" ("id", "dogId", "type", "title", "identifier", "issuer", "issuedAt", "expiresAt", "frontImageUrl", "backImageUrl", "notes", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${currentDogId}, ${data.type}, ${values.title}, ${values.identifier}, ${values.issuer}, ${values.issuedAt}, ${values.expiresAt}, ${values.frontImageUrl}, ${values.backImageUrl}, ${values.notes}, ${new Date()})
      `;
    }

    if (uploadedFrontUrl && current?.frontImageUrl) await deleteImage(current.frontImageUrl);
    if (uploadedBackUrl && current?.backImageUrl) await deleteImage(current.backImageUrl);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    if (uploadedFrontUrl) await deleteImage(uploadedFrontUrl);
    if (uploadedBackUrl) await deleteImage(uploadedBackUrl);
    return fail(error);
  }
}

export async function saveLogAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const data = logSchema.parse(Object.fromEntries(formData));
    const current = data.id ? await prisma.dailyLog.findUnique({ where: { id: data.id } }) : null;
    const currentDogId = await petId(data.dogId || current?.dogId);
    const file = formData.get("image");
    const uploadedUrl = file instanceof File && file.size ? await saveImage(file) : null;
    const imageUrl = uploadedUrl || current?.imageUrl || null;
    const values = { dogId: currentDogId, type: data.type, title: data.title, notes: data.notes || null, occurredAt: inputDate(data.occurredAt), mood: data.mood === "未记录" ? null : data.mood, imageUrl };
    try {
      await prisma.$transaction(async (tx) => {
        const log = data.id
          ? await tx.dailyLog.update({ where: { id: data.id }, data: values })
          : await tx.dailyLog.create({ data: values });
        await syncDailyLogImagePhoto(tx, log, current?.imageUrl);
      });
    } catch (error) {
      if (uploadedUrl) await deleteImage(uploadedUrl);
      throw error;
    }
    if (uploadedUrl && current?.imageUrl) await deleteImage(current.imageUrl);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function deleteLogAction(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const logId = z.string().cuid().parse(id);
    const current = await prisma.$transaction(async (tx) => {
      const log = await tx.dailyLog.findUniqueOrThrow({ where: { id: logId } });
      if (log.imageUrl) await tx.photo.deleteMany({ where: { dailyLogId: log.id, url: log.imageUrl } });
      await tx.dailyLog.delete({ where: { id: log.id } });
      return log;
    });
    await deleteImage(current.imageUrl);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function saveExpenseAction(input: unknown): Promise<ActionResult> {
  try {
    await requireOwner();
    const data = expenseSchema.parse(input);
    const currentDogId = await petId(data.dogId);
    const values = { category: data.category, amountCents: Math.round(data.amount * 100), date: inputDate(data.date), merchant: data.merchant || null, notes: data.notes || null };
    if (data.id) await prisma.expense.update({ where: { id: data.id }, data: { ...values, dogId: currentDogId } });
    else await prisma.expense.create({ data: { ...values, dogId: currentDogId } });
    revalidatePath("/", "layout"); return { ok: true };
  } catch (error) { return fail(error); }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    await prisma.expense.delete({ where: { id: z.string().cuid().parse(id) } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function saveHealthAction(input: unknown): Promise<ActionResult> {
  try {
    await requireOwner();
    const data = healthSchema.parse(input);
    const currentDogId = await petId(data.dogId);
    const values = { type: data.type, title: data.title, date: inputDate(data.date), notes: data.notes || null, weightGrams: data.weightKg ? Math.round(Number(data.weightKg) * 1000) : null, nextReminderDate: data.nextReminderDate ? inputDate(data.nextReminderDate) : null };
    await prisma.$transaction(async (tx) => {
      const record = data.id
        ? await tx.healthRecord.update({ where: { id: data.id }, data: { ...values, dogId: currentDogId } })
        : await tx.healthRecord.create({ data: { ...values, dogId: currentDogId } });
      const marker = `health:${record.id}`;
      const reminder = await tx.reminder.findFirst({ where: { notes: marker } });
      if (data.nextReminderDate) {
        const reminderData = { dogId: currentDogId, title: `${data.title} · 下次提醒`, type: data.type, dueAt: inputDate(data.nextReminderDate), completed: false };
        if (reminder) await tx.reminder.update({ where: { id: reminder.id }, data: reminderData });
        else await tx.reminder.create({ data: { ...reminderData, notes: marker } });
      } else if (reminder) {
        await tx.reminder.delete({ where: { id: reminder.id } });
      }
    });
    revalidatePath("/", "layout"); return { ok: true };
  } catch (error) { return fail(error); }
}

export async function deleteHealthAction(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const recordId = z.string().cuid().parse(id);
    await prisma.$transaction([
      prisma.reminder.deleteMany({ where: { notes: `health:${recordId}` } }),
      prisma.healthRecord.delete({ where: { id: recordId } }),
    ]);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function completeReminderAction(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const reminderId = z.string().cuid().parse(id);
    await prisma.$transaction(async (tx) => {
      const reminder = await tx.reminder.findUniqueOrThrow({ where: { id: reminderId }, select: { notes: true } });
      await tx.reminder.update({ where: { id: reminderId }, data: { completed: true } });
      const linkedHealthId = linkedHealthRecordId(reminder.notes);
      if (linkedHealthId) await tx.healthRecord.updateMany({ where: { id: linkedHealthId }, data: { nextReminderDate: null } });
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function cancelReminderAction(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const reminderId = z.string().cuid().parse(id);
    await prisma.$transaction(async (tx) => {
      const reminder = await tx.reminder.findUniqueOrThrow({ where: { id: reminderId }, select: { notes: true } });
      await tx.reminder.delete({ where: { id: reminderId } });
      const linkedHealthId = linkedHealthRecordId(reminder.notes);
      if (linkedHealthId) await tx.healthRecord.updateMany({ where: { id: linkedHealthId }, data: { nextReminderDate: null } });
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function savePhotoAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const file = formData.get("image");
    if (!(file instanceof File) || !file.size) throw new Error("请选择一张图片");
    const data = photoSchema.parse(Object.fromEntries(formData));
    let currentDogId = await petId(data.dogId);
    if (data.dailyLogId) {
      const linkedLog = await prisma.dailyLog.findUnique({ where: { id: data.dailyLogId }, select: { id: true, dogId: true } });
      if (!linkedLog) throw new Error("关联的日常记录不存在");
      if (data.dogId && linkedLog.dogId !== currentDogId) throw new Error("关联记录不属于当前宠物");
      currentDogId = linkedLog.dogId;
    }
    const url = await saveImage(file);
    try {
      await prisma.photo.create({ data: { dogId: currentDogId, url, title: data.title || null, notes: data.notes || null, date: inputDate(data.date), dailyLogId: data.dailyLogId || null } });
    } catch (error) {
      await deleteImage(url);
      throw error;
    }
    revalidatePath("/", "layout"); return { ok: true };
  } catch (error) { return fail(error); }
}

function linkedHealthRecordId(notes?: string | null) {
  const raw = notes?.startsWith("health:") ? notes.slice("health:".length) : "";
  const parsed = z.string().cuid().safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function deletePhotoAction(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const photoId = z.string().cuid().parse(id);
    const photo = await prisma.$transaction(async (tx) => {
      const current = await tx.photo.findUniqueOrThrow({
        where: { id: photoId },
        include: { dailyLog: { select: { id: true, imageUrl: true } } },
      });
      if (current.dailyLog?.imageUrl === current.url) {
        await tx.dailyLog.update({ where: { id: current.dailyLog.id }, data: { imageUrl: null } });
      }
      await tx.photo.delete({ where: { id: current.id } });
      return current;
    });
    await deleteImage(photo.url);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireOwner();
    const data = passwordSchema.parse(input);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(data.currentPassword, user.passwordHash))) throw new Error("当前密码不正确");
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(data.newPassword, 12) } });
    return { ok: true };
  } catch (error) { return fail(error); }
}

export async function saveGuestAccountAction(input: unknown): Promise<ActionResult> {
  try {
    await requireOwner();
    const data = guestAccountSchema.parse(input);
    if (!data.enabled) {
      await prisma.user.updateMany({ where: { role: USER_ROLES.GUEST }, data: { disabledAt: new Date() } });
      revalidatePath("/settings");
      return { ok: true };
    }

    const email = data.email!.trim().toLowerCase();
    const guestByRole = await prisma.user.findFirst({ where: { role: USER_ROLES.GUEST }, orderBy: { createdAt: "asc" } });
    const userWithEmail = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    const guest = guestByRole ?? (userWithEmail && normalizeRole(userWithEmail.role) === USER_ROLES.GUEST ? userWithEmail : null);
    if (userWithEmail && userWithEmail.id !== guest?.id) throw new Error("这个邮箱已经被其他账号使用");
    if (!guest && !data.password) throw new Error("首次创建访客账号需要设置至少 8 位密码");

    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
    const passwordData = passwordHash ? { passwordHash } : {};
    if (guest) {
      await prisma.user.update({
        where: { id: guest.id },
        data: { email, name: "PawDay 访客", role: USER_ROLES.GUEST, disabledAt: null, ...passwordData },
      });
      await prisma.user.updateMany({ where: { role: USER_ROLES.GUEST, id: { not: guest.id } }, data: { disabledAt: new Date() } });
    } else {
      await prisma.user.create({
        data: { email, name: "PawDay 访客", role: USER_ROLES.GUEST, passwordHash: passwordHash! },
      });
    }

    revalidatePath("/settings");
    return { ok: true };
  } catch (error) { return fail(error); }
}
