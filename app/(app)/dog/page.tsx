import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckCircle2, FileText, Heart, PawPrint, Scale, ShieldCheck, UserRound as VenusAndMars } from "lucide-react";
import { auth } from "@/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import { isGuestRole } from "@/lib/roles";
import { imageVariantUrl } from "@/lib/image-variants";
import { daysTogether, dogAge, formatDate, toDateInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { DogDocumentCard, type DogDocumentView } from "@/components/dog-document-card";
import { DogHealthSummary, type DogHealthSummaryRecord } from "@/components/dog-health-summary";
import { EmptyState } from "@/components/empty-state";
import { DogDocumentForm, type DogDocumentFormValue } from "@/components/forms/dog-document-form";
import { DogForm } from "@/components/forms/dog-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "小狗档案" };

type DocumentType = "狗证" | "免疫证";
const profileActionClass = "h-10 w-full rounded-xl px-2 text-xs sm:h-11 sm:w-auto sm:px-5 sm:text-sm";

type RawDogDocument = {
  id: string;
  type: string;
  title: string | null;
  identifier: string | null;
  issuer: string | null;
  issuedAt: Date | string | null;
  expiresAt: Date | string | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  notes: string | null;
  updatedAt: Date | string;
};

export default async function DogPage() {
  await ensureDatabase();
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);

  const dog = await prisma.dog.findFirst({
    include: {
      photos: { orderBy: { date: "desc" }, take: 5 },
      _count: { select: { dailyLogs: true, photos: true, health: true } },
    },
  });

  if (!dog) {
    return (
      <>
        <PageHeader eyebrow="DOG PROFILE" title="小狗档案" description="从名字开始，建立属于它的成长档案。" />
        <div className="soft-card rounded-3xl">
          <EmptyState title="还没有小狗档案" description="先记录名字和生日，PawDay 才能开始计算你们的陪伴时光。" action={canWrite ? <DogForm onboarding /> : undefined} />
        </div>
      </>
    );
  }

  const [documentRows, careRecords] = await Promise.all([
    prisma.$queryRaw<RawDogDocument[]>`
      SELECT "id", "type", "title", "identifier", "issuer", "issuedAt", "expiresAt", "frontImageUrl", "backImageUrl", "notes", "updatedAt"
      FROM "DogDocument"
      WHERE "dogId" = ${dog.id}
      ORDER BY "updatedAt" DESC
    `,
    prisma.healthRecord.findMany({
      where: { dogId: dog.id, type: { in: ["疫苗", "驱虫"] } },
      orderBy: { date: "desc" },
      take: 24,
    }),
  ]);

  const documents = documentRows.map(serializeDocument);
  const documentMap = new Map(documents.map((document) => [document.type, document]));
  const dogLicense = documentMap.get("狗证") || null;
  const immunityCard = documentMap.get("免疫证") || null;
  const vaccines = careRecords.filter((record) => record.type === "疫苗").map(serializeHealthRecord);
  const deworming = careRecords.filter((record) => record.type === "驱虫").map(serializeHealthRecord);
  const together = daysTogether(dog.adoptionDate);
  const checklist = [
    { label: "头像", done: Boolean(dog.avatarUrl) },
    { label: "品种", done: Boolean(dog.breed) },
    { label: "生日", done: Boolean(dog.birthDate) },
    { label: "到家日", done: Boolean(dog.adoptionDate) },
    { label: "体重", done: Boolean(dog.weightGrams) },
    { label: "狗证", done: Boolean(dogLicense) },
    { label: "免疫证", done: Boolean(immunityCard) },
    { label: "疫苗记录", done: vaccines.length > 0 },
    { label: "驱虫记录", done: deworming.length > 0 },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="DOG PROFILE"
        title={`${dog.name} 的档案`}
        description="关于它的基本信息、证件、健康护理，以及你们一起走过的时间。"
        action={<div className={`grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:justify-end ${canWrite ? "grid-cols-2" : "grid-cols-1"}`}>
          <Button asChild variant="outline" className={profileActionClass}><Link href="/dog/report"><FileText className="size-4" />健康档案</Link></Button>
          {canWrite && <DogForm dog={{
            name: dog.name,
            breed: dog.breed || "",
            sex: (dog.sex || "未知") as "男孩" | "女孩" | "未知",
            birthDate: toDateInput(dog.birthDate),
            adoptionDate: toDateInput(dog.adoptionDate),
            weightKg: dog.weightGrams ? dog.weightGrams / 1000 : "",
            avatarUrl: dog.avatarUrl || "",
          }} triggerClassName={profileActionClass} />}
        </div>}
      />

      <section className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#efd8c1] to-[#d8e3d5] dark:from-[#47362c] dark:to-[#27382b]">
          {dog.avatarUrl ? (
            <Image src={imageVariantUrl(dog.avatarUrl, "medium")} alt={dog.name} fill priority unoptimized className="object-cover" sizes="(max-width:1024px) 100vw, 42vw" />
          ) : (
            <div className="grid h-full place-items-center"><PawPrint className="size-32 text-white/70" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white">
            <p className="text-sm text-white/70">MY LITTLE FAMILY</p>
            <h2 className="mt-1 text-4xl font-semibold tracking-[-.05em]">{dog.name}</h2>
            <p className="mt-2 text-sm text-white/75">{dog.breed || "特别可爱的小狗"} · {dog.sex || "性别未记录"}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Info icon={CalendarDays} label="年龄" value={dogAge(dog.birthDate)} color="orange" />
            <Info icon={Heart} label="陪伴天数" value={together ? `${together} 天` : "待记录"} color="sage" />
            <Info icon={Scale} label="当前体重" value={dog.weightGrams ? `${(dog.weightGrams / 1000).toFixed(2)} kg` : "待记录"} color="gold" />
            <Info icon={VenusAndMars} label="性别" value={dog.sex || "未知"} color="violet" />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="soft-card rounded-3xl p-6">
              <h3 className="font-semibold">成长小档案</h3>
              <div className="mt-5 divide-y">
                <Row label="生日" value={formatDate(dog.birthDate)} />
                <Row label="来到家的日子" value={dog.adoptionDate ? formatDate(dog.adoptionDate) : "还没有记录"} />
                <Row label="日常记录" value={`${dog._count.dailyLogs} 条`} />
                <Row label="健康记录" value={`${dog._count.health} 条`} />
                <Row label="照片回忆" value={`${dog._count.photos} 张`} />
              </div>
            </div>
            <CompletenessCard items={checklist} />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div>
          <SectionTitle title="证件信息" description="狗证和免疫证集中保存，正反面图片都能随时查看。" />
          <div className="grid gap-4 md:grid-cols-2">
            <DogDocumentCard
              type="狗证"
              document={dogLicense}
              action={canWrite ? <DogDocumentForm key={dogLicense?.updatedAt || "new-dog-license"} type="狗证" initial={documentFormValue("狗证", dogLicense)} triggerLabel={dogLicense ? "编辑" : "新增"} triggerVariant="ghost" /> : undefined}
            />
            <DogDocumentCard
              type="免疫证"
              document={immunityCard}
              action={canWrite ? <DogDocumentForm key={immunityCard?.updatedAt || "new-immunity-card"} type="免疫证" initial={documentFormValue("免疫证", immunityCard)} triggerLabel={immunityCard ? "编辑" : "新增"} triggerVariant="ghost" /> : undefined}
            />
          </div>
        </div>

        <div>
          <SectionTitle title="健康护理" description="从健康记录里自动汇总疫苗和驱虫，点开能看具体信息。" />
          <div className="soft-card rounded-3xl p-4 sm:p-5">
            <DogHealthSummary vaccines={vaccines} deworming={deworming} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <SectionTitle title="最近的模样" description="成长总是在照片里最明显。" compact />
          <Button asChild variant="ghost" size="sm"><Link href="/photos">打开相册</Link></Button>
        </div>
        {dog.photos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {dog.photos.map((photo, index) => (
              <div key={photo.id} className={`relative overflow-hidden rounded-3xl ${index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                <Image src={imageVariantUrl(photo.url, "thumb")} alt={photo.title || dog.name} fill unoptimized className="object-cover" sizes="20vw" />
              </div>
            ))}
          </div>
        ) : (
          <div className="soft-card rounded-3xl">
            <EmptyState compact title="相册还是空的" description="下一次它看向镜头时，就把那一刻留下来。" />
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) {
  const tones: Record<string, string> = {
    orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    gold: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
  };

  return (
    <div className="soft-card rounded-3xl p-5">
      <div className={`grid size-9 place-items-center rounded-xl ${tones[color]}`}><Icon className="size-4" /></div>
      <p className="mt-4 text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function CompletenessCard({ items }: { items: { label: string; done: boolean }[] }) {
  const completed = items.filter((item) => item.done).length;
  const percent = Math.round((completed / items.length) * 100);
  const missing = items.filter((item) => !item.done).slice(0, 4);

  return (
    <div className="soft-card rounded-3xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">档案完整度</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">把常用信息补齐，日后查询会轻很多。</p>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-[var(--sage-soft)] text-sm font-bold text-[var(--sage)]">{percent}%</div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[.05] dark:bg-white/[.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[var(--sage)]" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${item.done ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-black/[.04] text-[var(--muted)] dark:bg-white/[.055]"}`}>
            {item.done && <CheckCircle2 className="size-3" />}
            {item.label}
          </span>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
        {missing.length ? `建议继续补充：${missing.map((item) => item.label).join("、")}。` : "档案信息已经很完整，可以放心查询和备份。"}
      </p>
    </div>
  );
}

function SectionTitle({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mb-4"}>
      <div className="flex items-center gap-2">
        {!compact && <ShieldCheck className="size-4 text-[var(--orange)]" />}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

function serializeDocument(row: RawDogDocument): DogDocumentView {
  return {
    id: row.id,
    type: row.type === "免疫证" ? "免疫证" : "狗证",
    title: row.title,
    identifier: row.identifier,
    issuer: row.issuer,
    issuedAt: toIso(row.issuedAt),
    expiresAt: toIso(row.expiresAt),
    frontImageUrl: row.frontImageUrl,
    backImageUrl: row.backImageUrl,
    notes: row.notes,
    updatedAt: toIso(row.updatedAt) || new Date().toISOString(),
  };
}

function serializeHealthRecord(record: { id: string; type: string; title: string; date: Date; notes: string | null; weightGrams: number | null; nextReminderDate: Date | null }): DogHealthSummaryRecord {
  return {
    id: record.id,
    type: record.type === "驱虫" ? "驱虫" : "疫苗",
    title: record.title,
    date: record.date.toISOString(),
    notes: record.notes,
    weightGrams: record.weightGrams,
    nextReminderDate: record.nextReminderDate?.toISOString() || null,
  };
}

function documentFormValue(type: DocumentType, document?: DogDocumentView | null): DogDocumentFormValue | undefined {
  if (!document) return undefined;
  return {
    type,
    title: document.title || "",
    identifier: document.identifier || "",
    issuer: document.issuer || "",
    issuedAt: toDateInput(document.issuedAt),
    expiresAt: toDateInput(document.expiresAt),
    notes: document.notes || "",
    frontImageUrl: document.frontImageUrl || "",
    backImageUrl: document.backImageUrl || "",
  };
}

function toIso(value?: Date | string | null) {
  return value ? new Date(value).toISOString() : null;
}
