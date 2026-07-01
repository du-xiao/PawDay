import { redirect } from "next/navigation";
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
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, disabledAt: true },
  });
  if (!currentUser || currentUser.disabledAt) redirect("/login");
  const dog = await prisma.dog.findFirst({ select: { id: true } });
  const quickLogs = dog ? await prisma.dailyLog.findMany({
    where: { dogId: dog.id },
    select: { id: true, title: true },
    orderBy: { occurredAt: "desc" },
    take: 30,
  }) : [];
  return <AppShell email={currentUser.email} role={normalizeRole(currentUser.role)} dogExists={Boolean(dog)} quickLogs={quickLogs}>{children}</AppShell>;
}
