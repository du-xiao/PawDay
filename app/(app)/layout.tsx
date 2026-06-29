import { redirect } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { auth } from "@/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";
import { formatDate } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await ensureDatabase();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, disabledAt: true },
  });
  if (!currentUser || currentUser.disabledAt) redirect("/login");
  const dog = await prisma.dog.findFirst({ select: { id: true } });
  const reminder = dog ? await prisma.reminder.findFirst({
    where: { dogId: dog.id, completed: false },
    orderBy: { dueAt: "asc" },
    select: { title: true, dueAt: true },
  }) : null;
  const daysUntilDue = reminder ? differenceInCalendarDays(reminder.dueAt, new Date()) : null;
  const reminderCard = !dog
    ? { href: "/dog", title: "先创建小狗档案", detail: "有了档案后，才能设置健康提醒。", urgent: false }
    : reminder
      ? {
          href: "/health",
          title: reminder.title,
          detail: daysUntilDue === 0
            ? `今天到期 · ${formatDate(reminder.dueAt)}`
            : daysUntilDue! < 0
              ? `已逾期 ${Math.abs(daysUntilDue!)} 天 · ${formatDate(reminder.dueAt)}`
              : `${daysUntilDue} 天后 · ${formatDate(reminder.dueAt)}`,
          urgent: daysUntilDue! <= 0,
        }
      : { href: "/health", title: "暂无健康提醒", detail: "新增健康记录时可以设置下次提醒。", urgent: false };
  return <AppShell email={currentUser.email} role={normalizeRole(currentUser.role)} reminder={reminderCard}>{children}</AppShell>;
}
