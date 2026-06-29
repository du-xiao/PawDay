import { redirect } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { auth } from "@/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await ensureDatabase();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [currentUser, dog] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, role: true, disabledAt: true },
    }),
    prisma.dog.findFirst({ select: { id: true } }),
  ]);
  if (!currentUser || currentUser.disabledAt) redirect("/login");
  const reminder = dog ? await prisma.reminder.findFirst({
    where: { dogId: dog.id, completed: false },
    orderBy: { dueAt: "asc" },
    select: { dueAt: true },
  }) : null;
  const reminderStatus = reminder ? {
    href: "/health",
    hasPending: true,
    overdue: differenceInCalendarDays(reminder.dueAt, new Date()) < 0,
  } : null;
  return <AppShell email={currentUser.email} role={normalizeRole(currentUser.role)} reminder={reminderStatus}>{children}</AppShell>;
}
