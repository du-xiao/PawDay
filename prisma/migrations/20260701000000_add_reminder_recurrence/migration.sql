ALTER TABLE "Reminder" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "Reminder" ADD COLUMN "repeatInterval" INTEGER;
ALTER TABLE "Reminder" ADD COLUMN "repeatUnit" TEXT;
