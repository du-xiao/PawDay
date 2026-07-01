import { Database, Eye, FolderOpen, HardDriveDownload, KeyRound, LockKeyhole, Server, UserCog } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isGuestRole, roleLabel, USER_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { GuestAccountForm } from "@/components/forms/guest-account-form";
import { PasswordForm } from "@/components/forms/password-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "设置" };

export default async function SettingsPage() {
  const session = await auth();
  const isGuest = isGuestRole(session?.user.role);
  const guest = await prisma.user.findFirst({
    where: { role: USER_ROLES.GUEST },
    orderBy: { createdAt: "asc" },
    select: { email: true, disabledAt: true },
  });
  const guestValue = {
    exists: Boolean(guest),
    enabled: Boolean(guest && !guest.disabledAt),
    email: guest?.email || process.env.GUEST_EMAIL || "",
  };

  return (
    <div className="page-enter">
      <PageHeader eyebrow="SETTINGS" title="设置" description="管理账号安全、访客只读账号，以及了解数据保存在哪里。" />

      <section className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <div className="space-y-5">
          <div className="soft-card rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><LockKeyhole className="size-5" /></div>
              <div className="min-w-0">
                <p className="font-semibold">{roleLabel(session?.user.role)}账号</p>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">{session?.user?.email}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-black/[.035] p-4 text-xs leading-relaxed text-[var(--muted)] dark:bg-white/[.04]">
              {isGuest
                ? "当前是访客只读模式，可以查看数据，但不能新增、编辑、删除或修改账号。"
                : "主人账号拥有全部写入权限，可以修改密码并管理访客只读账号。Docker Compose 中的管理员变量只在空数据库首次启动时创建账号。"}
            </div>
          </div>

          <div className="soft-card rounded-3xl p-6">
            <h2 className="font-semibold">存储位置</h2>
            <div className="mt-5 space-y-4">
              <Storage icon={Database} label="SQLite 数据库" value={process.env.DATABASE_URL || "file:./data/pawday.db"} />
              <Storage icon={FolderOpen} label="图片目录" value={process.env.UPLOAD_DIR || "./uploads"} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {!isGuest && (
            <>
              <section id="guest" className="soft-card scroll-mt-28 rounded-3xl p-6 sm:p-7">
                <div className="mb-6 flex items-center gap-4">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><UserCog className="size-5" /></div>
                  <div>
                    <h2 className="font-semibold">访客账号</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">访客账号只能查看信息，所有写操作都会被服务端拦截。</p>
                  </div>
                </div>
                <GuestAccountForm guest={guestValue} />
              </section>

              <section id="password" className="soft-card scroll-mt-28 rounded-3xl p-6 sm:p-7">
                <div className="mb-6 flex items-center gap-4">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[var(--sage-soft)] text-[var(--sage)]"><KeyRound className="size-5" /></div>
                  <div>
                    <h2 className="font-semibold">修改主人密码</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">修改后，现有登录会话仍保持有效。</p>
                  </div>
                </div>
                <PasswordForm />
              </section>
            </>
          )}

          {isGuest && (
            <section className="soft-card rounded-3xl p-6 sm:p-7">
              <div className="flex items-center gap-4">
                <div className="grid size-11 place-items-center rounded-2xl bg-[var(--sage-soft)] text-[var(--sage)]"><Eye className="size-5" /></div>
                <div>
                  <h2 className="font-semibold">只读访问</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">如需新增或修改记录，请使用主人账号登录。</p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl bg-[#2c2924] p-6 text-white dark:bg-[#ebe4da] dark:text-[#28241f]">
            <div className="flex items-center gap-3"><HardDriveDownload className="size-5" /><h2 className="font-semibold">备份建议</h2></div>
            <p className="mt-4 text-sm leading-relaxed text-white/65 dark:text-black/60">
              定期备份宿主机的 <code className="rounded bg-white/10 px-1.5 py-0.5">./data</code> 和 <code className="rounded bg-white/10 px-1.5 py-0.5">./uploads</code> 两个目录。恢复时停止容器，替换目录内容后重新启动即可。
            </p>
            {!isGuest && <Button asChild variant="secondary" className="mt-5 bg-white/12 text-white hover:bg-white/18 dark:bg-black/[.06] dark:text-[#28241f] dark:hover:bg-black/[.1]">
              <a href="/api/export">导出备份包</a>
            </Button>}
            <div className="mt-5 flex items-center gap-2 text-xs text-white/45 dark:text-black/45"><Server className="size-4" />数据完全保存在你的 NAS 上</div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Storage({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-black/[.04] text-[var(--muted)] dark:bg-white/[.06]"><Icon className="size-4" /></span>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <code className="mt-1 block break-all text-sm">{value}</code>
      </div>
    </div>
  );
}
