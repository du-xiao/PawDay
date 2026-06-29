import { z } from "zod";

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));

export const loginSchema = z.object({
  email: z.string().trim().email("请输入正确的邮箱"),
  password: z.string().min(1, "请输入密码"),
});

export const dogSchema = z.object({
  name: z.string().trim().min(1, "请填写名字").max(30),
  breed: z.string().trim().max(50).optional().or(z.literal("")),
  sex: z.enum(["男孩", "女孩", "未知"]),
  birthDate: z.string().min(1, "请选择生日"),
  adoptionDate: z.string().optional().or(z.literal("")),
  weightKg: z.coerce.number().positive().max(150).optional().or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
});

export const dogDocumentSchema = z.object({
  type: z.enum(["狗证", "免疫证"]),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  identifier: z.string().trim().max(80).optional().or(z.literal("")),
  issuer: z.string().trim().max(80).optional().or(z.literal("")),
  issuedAt: z.string().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  notes: optionalText,
});

export const guestAccountSchema = z.object({
  enabled: z.boolean(),
  email: z.string().trim().max(120).optional().or(z.literal("")),
  password: z.string().max(128).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (!data.enabled) return;
  if (!data.email) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "请填写访客邮箱", path: ["email"] });
    return;
  }
  if (!z.string().email().safeParse(data.email).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "请输入正确的访客邮箱", path: ["email"] });
  }
  if (data.password && data.password.length < 8) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "访客密码至少 8 位，留空则不修改", path: ["password"] });
  }
});

export const logSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum(["喂食", "遛狗", "洗澡", "排便", "睡眠", "训练", "情绪", "其他"]),
  title: z.string().trim().min(1, "请填写标题").max(80),
  notes: optionalText,
  occurredAt: z.string().min(1, "请选择时间"),
  mood: z.enum(["开心", "平静", "兴奋", "困倦", "不舒服", "未记录"]),
  imageUrl: z.string().optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  id: z.string().cuid().optional(),
  category: z.enum(["狗粮", "零食", "医疗", "洗护", "玩具", "用品", "保险", "寄养", "其他"]),
  amount: z.coerce.number().positive("金额必须大于 0").max(999999),
  date: z.string().min(1, "请选择日期"),
  merchant: z.string().trim().max(80).optional().or(z.literal("")),
  notes: optionalText,
});

export const healthSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum(["疫苗", "驱虫", "体检", "用药", "疾病", "绝育", "体重"]),
  title: z.string().trim().min(1, "请填写标题").max(80),
  date: z.string().min(1, "请选择日期"),
  notes: optionalText,
  weightKg: z.coerce.number().positive().max(150).optional().or(z.literal("")),
  nextReminderDate: z.string().optional().or(z.literal("")),
});

export const photoSchema = z.object({
  title: z.string().trim().max(80).optional().or(z.literal("")),
  notes: optionalText,
  date: z.string().min(1, "请选择日期"),
  dailyLogId: z.string().cuid().optional().or(z.literal("")),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(8, "新密码至少 8 位").max(128),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的新密码不一致",
  path: ["confirmPassword"],
});
