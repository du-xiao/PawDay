import "dotenv/config";
import bcrypt from "bcrypt";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "owner@pawday.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "pawday123";
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "PawDay 主人", passwordHash: await bcrypt.hash(password, 12) },
  });

  let dog = await prisma.dog.findFirst();
  if (!dog) {
    dog = await prisma.dog.create({ data: { name: "奶糖", breed: "比熊", sex: "女孩", birthDate: new Date("2023-04-18T00:00:00+08:00"), adoptionDate: new Date("2023-07-02T00:00:00+08:00"), weightGrams: 5250 } });
    const log1 = await prisma.dailyLog.create({ data: { dogId: dog.id, type: "遛狗", title: "沿着河边走了很远", notes: "风很舒服，遇见了两位熟悉的小朋友。", occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), mood: "开心" } });
    await prisma.dailyLog.createMany({ data: [
      { dogId: dog.id, type: "喂食", title: "晚饭全部吃光", notes: "今天胃口很好。", occurredAt: new Date(Date.now() - 6 * 60 * 60 * 1000), mood: "兴奋" },
      { dogId: dog.id, type: "洗澡", title: "洗完变成一朵蓬松的云", occurredAt: new Date(Date.now() - 3 * 86400000), mood: "平静" },
      { dogId: dog.id, type: "训练", title: "学会等待零食", notes: "成功坚持了 8 秒。", occurredAt: new Date(Date.now() - 5 * 86400000), mood: "开心" },
    ] });
    await prisma.expense.createMany({ data: [
      { dogId: dog.id, category: "狗粮", amountCents: 32900, date: new Date(), merchant: "宠物生活馆", notes: "低敏小颗粒" },
      { dogId: dog.id, category: "洗护", amountCents: 16800, date: new Date(Date.now() - 9 * 86400000), merchant: "附近的宠物店" },
      { dogId: dog.id, category: "玩具", amountCents: 5900, date: new Date(Date.now() - 19 * 86400000), merchant: "线上商城", notes: "新的嗅闻玩具" },
      { dogId: dog.id, category: "医疗", amountCents: 46000, date: new Date(Date.now() - 70 * 86400000), merchant: "安心动物医院" },
    ] });
    await prisma.healthRecord.createMany({ data: [
      { dogId: dog.id, type: "体重", title: "月度称重", date: new Date(Date.now() - 120 * 86400000), weightGrams: 4880 },
      { dogId: dog.id, type: "体重", title: "月度称重", date: new Date(Date.now() - 90 * 86400000), weightGrams: 5020 },
      { dogId: dog.id, type: "体重", title: "月度称重", date: new Date(Date.now() - 60 * 86400000), weightGrams: 5140 },
      { dogId: dog.id, type: "体重", title: "月度称重", date: new Date(Date.now() - 30 * 86400000), weightGrams: 5250 },
      { dogId: dog.id, type: "驱虫", title: "体内外驱虫", date: new Date(Date.now() - 18 * 86400000), notes: "状态良好，没有不适反应。", nextReminderDate: new Date(Date.now() + 72 * 86400000) },
      { dogId: dog.id, type: "疫苗", title: "年度加强针", date: new Date(Date.now() - 150 * 86400000), notes: "留观 30 分钟，一切正常。" },
    ] });
    await prisma.reminder.create({ data: { dogId: dog.id, type: "驱虫", title: "下一次体内外驱虫", dueAt: new Date(Date.now() + 72 * 86400000) } });
    const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
    await mkdir(uploadRoot, { recursive: true });
    const seedName = "pawday-seed-memory.png";
    await copyFile(path.join(process.cwd(), "public", "pawday-hero.png"), path.join(uploadRoot, seedName));
    await prisma.photo.create({ data: { dogId: dog.id, dailyLogId: log1.id, url: `/uploads/${seedName}`, title: "有阳光的下午", notes: "今天也在认真享受自己的小世界。", date: new Date() } });
  }
  console.log(`Seed complete. Login: ${email}`);
}

main().finally(() => prisma.$disconnect());
