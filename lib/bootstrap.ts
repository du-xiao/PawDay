import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/db";

let bootstrapped: Promise<void> | null = null;

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT, "email" TEXT NOT NULL, "emailVerified" DATETIME, "image" TEXT, "passwordHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE TABLE IF NOT EXISTS "Account" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "provider" TEXT NOT NULL, "providerAccountId" TEXT NOT NULL, "refresh_token" TEXT, "access_token" TEXT, "expires_at" INTEGER, "token_type" TEXT, "scope" TEXT, "id_token" TEXT, "session_state" TEXT, CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,
  `CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT NOT NULL PRIMARY KEY, "sessionToken" TEXT NOT NULL, "userId" TEXT NOT NULL, "expires" DATETIME NOT NULL, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken")`,
  `CREATE TABLE IF NOT EXISTS "VerificationToken" ("identifier" TEXT NOT NULL, "token" TEXT NOT NULL, "expires" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,
  `CREATE TABLE IF NOT EXISTS "Dog" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "breed" TEXT, "sex" TEXT, "birthDate" DATETIME NOT NULL, "adoptionDate" DATETIME, "weightGrams" INTEGER, "avatarUrl" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "DailyLog" ("id" TEXT NOT NULL PRIMARY KEY, "dogId" TEXT NOT NULL, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "notes" TEXT, "occurredAt" DATETIME NOT NULL, "mood" TEXT, "imageUrl" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "DailyLog_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "DailyLog_occurredAt_idx" ON "DailyLog"("occurredAt")`,
  `CREATE TABLE IF NOT EXISTS "Expense" ("id" TEXT NOT NULL PRIMARY KEY, "dogId" TEXT NOT NULL, "category" TEXT NOT NULL, "amountCents" INTEGER NOT NULL, "date" DATETIME NOT NULL, "merchant" TEXT, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Expense_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date")`,
  `CREATE TABLE IF NOT EXISTS "HealthRecord" ("id" TEXT NOT NULL PRIMARY KEY, "dogId" TEXT NOT NULL, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "date" DATETIME NOT NULL, "notes" TEXT, "weightGrams" INTEGER, "nextReminderDate" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "HealthRecord_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "HealthRecord_date_idx" ON "HealthRecord"("date")`,
  `CREATE TABLE IF NOT EXISTS "Photo" ("id" TEXT NOT NULL PRIMARY KEY, "dogId" TEXT NOT NULL, "dailyLogId" TEXT, "url" TEXT NOT NULL, "title" TEXT, "notes" TEXT, "date" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Photo_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Photo_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "Photo_date_idx" ON "Photo"("date")`,
  `CREATE TABLE IF NOT EXISTS "Reminder" ("id" TEXT NOT NULL PRIMARY KEY, "dogId" TEXT NOT NULL, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "dueAt" DATETIME NOT NULL, "completed" BOOLEAN NOT NULL DEFAULT false, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Reminder_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "Reminder_dueAt_idx" ON "Reminder"("dueAt")`,
];

export async function ensureDatabase() {
  if (!bootstrapped) {
    bootstrapped = (async () => {
      for (const statement of statements) await prisma.$executeRawUnsafe(statement);
      const count = await prisma.user.count();
      if (count === 0) {
        const config = z.object({
          email: z.string().trim().toLowerCase().email(),
          password: z.string().min(8),
        }).safeParse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
        if (!config.success) throw new Error("首次启动需要设置有效的 ADMIN_EMAIL，以及至少 8 位的 ADMIN_PASSWORD");
        await prisma.user.create({
          data: { email: config.data.email, name: "PawDay 主人", passwordHash: await bcrypt.hash(config.data.password, 12) },
        });
      }
    })().catch((error) => {
      bootstrapped = null;
      throw error;
    });
  }
  return bootstrapped;
}
