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
  return <AppShell email={currentUser.email} role={normalizeRole(currentUser.role)}>{children}</AppShell>;
}
