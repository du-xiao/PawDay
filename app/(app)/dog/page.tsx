import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckCircle2, Heart, PawPrint, Scale, ShieldCheck, UserRound as VenusAndMars } from "lucide-react";
import { auth } from "@/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import { isGuestRole } from "@/lib/roles";
import { normalizeSpecies, primaryDocumentType, speciesLabel, speciesShortLabel, type PetDocumentType } from "@/lib/pets";
import { daysTogether, formatDate, petAge, toDateInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { DogDocumentCard, type DogDocumentView } from "@/components/dog-document-card";
import { DogHealthSummary, type DogHealthSummaryRecord } from "@/components/dog-health-summary";
import { EmptyState } from "@/components/empty-state";
import { DogDocumentForm, type DogDocumentFormValue } from "@/components/forms/dog-document-form";
import { DogForm } from "@/components/forms/dog-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "宠物档案" };

type DocumentType = PetDocumentType;

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

export default async function DogPage({ searchParams }: { searchParams: Promise<{ pet?: string }> }) {
  await ensureDatabase();
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
  const params = await searchParams;

  const pets = await prisma.dog.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      photos: { orderBy: { date: "desc" }, take: 5 },
      _count: { select: { dailyLogs: true, photos: true, health: true } },
    },
  });

  if (!pets.length) {
    return (
      <>
        <PageHeader eyebrow="PET PROFILES" title="宠物档案" description="从名字开始，建立猫咪和狗狗的成长档案。" />
        <div className="soft-card rounded-3xl">
          <EmptyState title="还没有宠物档案" description="先记录名字和生日，PawDay 才能开始计算你们的陪伴时光。" action={canWrite ? <DogForm onboarding /> : undefined} />
        </div>
      </>
    );
  }

  const selectedPetId = pets.some((pet) => pet.id === params.pet) ? params.pet! : pets[0].id;
  const dog = pets.find((pet) => pet.id === selectedPetId) || pets[0];
  const selectedDocumentType = primaryDocumentType(dog.species);

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
  const primaryDocument = documentMap.get(selectedDocumentType) || null;
  const immunityCard = documentMap.get("免疫证") || null;
  const vaccines = careRecords.filter((record) => record.type === "疫苗").map(serializeHealthRecord);
  const deworming = careRecords.filter((record) => record.type === "驱虫").map(serializeHealthRecord);
  const together = daysTogether(dog.adoptionDate);
  const checklist = [
    { label: "头像", done: Boolean(dog.avatarUrl) },
    { label: "种类", done: Boolean(dog.species) },
    { label: "品种", done: Boolean(dog.breed) },
    { label: "生日", done: Boolean(dog.birthDate) },
    { label: "到家日", done: Boolean(dog.adoptionDate) },
    { label: "体重", done: Boolean(dog.weightGrams) },
    { label: selectedDocumentType, done: Boolean(primaryDocument) },
    { label: "免疫证", done: Boolean(immunityCard) },
    { label: "疫苗记录", done: vaccines.length > 0 },
    { label: "驱虫记录", done: deworming.length > 0 },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="PET PROFILES"
        title={`${dog.name} 的档案`}
        description="管理家里每一位小朋友的基本信息、证件、健康护理和成长照片。"
        action={canWrite ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <DogForm dog={{
              id: dog.id,
              species: normalizeSpecies(dog.species),
              name: dog.name,
              breed: dog.breed || "",
              sex: (dog.sex || "未知") as "男孩" | "女孩" | "未知",
              birthDate: toDateInput(dog.birthDate),
              adoptionDate: toDateInput(dog.adoptionDate),
              weightKg: dog.weightGrams ? dog.weightGrams / 1000 : "",
              avatarUrl: dog.avatarUrl || "",
            }} />
            <DogForm />
          </div>
        ) : undefined}
      />

      {pets.length > 1 && <PetSwitcher pets={pets.map((pet) => ({ id: pet.id, name: pet.name, species: pet.species, avatarUrl: pet.avatarUrl }))} activeId={dog.id} />}

      <section className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#efd8c1] to-[#d8e3d5] dark:from-[#47362c] dark:to-[#27382b]">
          {dog.avatarUrl ? (
            <Image src={dog.avatarUrl} alt={dog.name} fill priority unoptimized className="object-cover" sizes="(max-width:1024px) 100vw, 42vw" />
          ) : (
            <div className="grid h-full place-items-center"><PawPrint className="size-32 text-white/70" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white">
            <p className="text-sm text-white/70">MY LITTLE FAMILY · {speciesLabel(dog.species)}</p>
            <h2 className="mt-1 text-4xl font-semibold tracking-[-.05em]">{dog.name}</h2>
            <p className="mt-2 text-sm text-white/75">{dog.breed || `特别可爱的${speciesShortLabel(dog.species)}`} · {dog.sex || "性别未记录"}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Info icon={CalendarDays} label="年龄" value={petAge(dog.birthDate)} color="orange" />
            <Info icon={Heart} label="陪伴天数" value={together ? `${together} 天` : "待记录"} color="sage" />
            <Info icon={Scale} label="当前体重" value={dog.weightGrams ? `${(dog.weightGrams / 1000).toFixed(2)} kg` : "待记录"} color="gold" />
            <Info icon={VenusAndMars} label="性别" value={dog.sex || "未知"} color="violet" />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="soft-card rounded-3xl p-6">
              <h3 className="font-semibold">成长小档案</h3>
              <div className="mt-5 divide-y">
                <Row label="种类" value={speciesLabel(dog.species)} />
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
          <SectionTitle title="证件信息" description={`${selectedDocumentType}和免疫证集中保存，正反面图片都能随时查看。`} />
          <div className="grid gap-4 md:grid-cols-2">
            <DogDocumentCard
              type={selectedDocumentType}
              document={primaryDocument}
              action={canWrite ? <DogDocumentForm dogId={dog.id} key={primaryDocument?.updatedAt || `new-${selectedDocumentType}`} type={selectedDocumentType} initial={documentFormValue(selectedDocumentType, primaryDocument)} triggerLabel={primaryDocument ? "编辑" : "新增"} triggerVariant="ghost" /> : undefined}
            />
            <DogDocumentCard
              type="免疫证"
              document={immunityCard}
              action={canWrite ? <DogDocumentForm dogId={dog.id} key={immunityCard?.updatedAt || "new-immunity-card"} type="免疫证" initial={documentFormValue("免疫证", immunityCard)} triggerLabel={immunityCard ? "编辑" : "新增"} triggerVariant="ghost" /> : undefined}
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
          <Button asChild variant="ghost" size="sm"><Link href={`/photos?pet=${dog.id}`}>打开相册</Link></Button>
        </div>
        {dog.photos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {dog.photos.map((photo, index) => (
              <div key={photo.id} className={`relative overflow-hidden rounded-3xl ${index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                <Image src={photo.url} alt={photo.title || dog.name} fill unoptimized className="object-cover" sizes="20vw" />
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

function PetSwitcher({ pets, activeId }: { pets: { id: string; name: string; species: string; avatarUrl: string | null }[]; activeId: string }) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {pets.map((pet) => {
        const active = pet.id === activeId;
        return (
          <Link key={pet.id} href={`/dog?pet=${pet.id}`} className={`flex items-center gap-3 rounded-3xl border p-3 transition hover:-translate-y-0.5 hover:shadow-lg ${active ? "bg-[var(--orange-soft)] border-orange-200/60 shadow-sm shadow-orange-200/20" : "bg-[var(--card)]/60"}`}>
            <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/55 dark:bg-white/[.06]">
              {pet.avatarUrl ? <Image src={pet.avatarUrl} alt={pet.name} fill unoptimized className="object-cover" sizes="48px" /> : <PawPrint className="size-5 text-[var(--orange)]" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{pet.name}</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">{speciesLabel(pet.species)}</span>
            </span>
          </Link>
        );
      })}
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
    type: row.type === "免疫证" ? "免疫证" : row.type === "登记证" ? "登记证" : "狗证",
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
