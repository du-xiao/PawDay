import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await ensureDatabase();
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  return <AppShell email={session.user.email}>{children}</AppShell>;
}
