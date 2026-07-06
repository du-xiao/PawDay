import type { ComponentType, SVGProps } from "react";
import {
  Bone,
  Bug,
  CircleDollarSign,
  Cookie,
  Dumbbell,
  Footprints,
  Home,
  Moon,
  Pill,
  Scissors,
  ShieldCheck,
  ShowerHead,
  SmilePlus,
  Stethoscope,
  Syringe,
  Tag,
  Thermometer,
  Toilet,
  ToyBrick,
  Utensils,
  Weight,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
type TypeKind = "log" | "health" | "expense";
type TypeMeta = { icon: IconComponent; className: string };

const fallback: TypeMeta = { icon: Tag, className: "bg-stone-500/10 text-stone-600 ring-stone-500/10 dark:text-stone-300" };

const typeIcons: Record<TypeKind, Record<string, TypeMeta>> = {
  log: {
    喂食: { icon: Utensils, className: "bg-amber-500/10 text-amber-700 ring-amber-500/10 dark:text-amber-300" },
    遛狗: { icon: Footprints, className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/10 dark:text-emerald-300" },
    洗澡: { icon: ShowerHead, className: "bg-sky-500/10 text-sky-700 ring-sky-500/10 dark:text-sky-300" },
    排便: { icon: Toilet, className: "bg-lime-500/10 text-lime-700 ring-lime-500/10 dark:text-lime-300" },
    睡眠: { icon: Moon, className: "bg-violet-500/10 text-violet-700 ring-violet-500/10 dark:text-violet-300" },
    训练: { icon: Dumbbell, className: "bg-orange-500/10 text-orange-700 ring-orange-500/10 dark:text-orange-300" },
    情绪: { icon: SmilePlus, className: "bg-pink-500/10 text-pink-700 ring-pink-500/10 dark:text-pink-300" },
    其他: fallback,
  },
  health: {
    疫苗: { icon: Syringe, className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/10 dark:text-emerald-300" },
    驱虫: { icon: Bug, className: "bg-amber-500/10 text-amber-700 ring-amber-500/10 dark:text-amber-300" },
    体检: { icon: Stethoscope, className: "bg-sky-500/10 text-sky-700 ring-sky-500/10 dark:text-sky-300" },
    用药: { icon: Pill, className: "bg-violet-500/10 text-violet-700 ring-violet-500/10 dark:text-violet-300" },
    疾病: { icon: Thermometer, className: "bg-red-500/10 text-red-700 ring-red-500/10 dark:text-red-300" },
    绝育: { icon: Scissors, className: "bg-pink-500/10 text-pink-700 ring-pink-500/10 dark:text-pink-300" },
    体重: { icon: Weight, className: "bg-[var(--sage-soft)] text-[var(--sage)] ring-black/5 dark:ring-white/10" },
  },
  expense: {
    狗粮: { icon: Wheat, className: "bg-amber-500/10 text-amber-700 ring-amber-500/10 dark:text-amber-300" },
    零食: { icon: Cookie, className: "bg-orange-500/10 text-orange-700 ring-orange-500/10 dark:text-orange-300" },
    医疗: { icon: Stethoscope, className: "bg-red-500/10 text-red-700 ring-red-500/10 dark:text-red-300" },
    洗护: { icon: ShowerHead, className: "bg-sky-500/10 text-sky-700 ring-sky-500/10 dark:text-sky-300" },
    玩具: { icon: ToyBrick, className: "bg-violet-500/10 text-violet-700 ring-violet-500/10 dark:text-violet-300" },
    用品: { icon: Bone, className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/10 dark:text-emerald-300" },
    保险: { icon: ShieldCheck, className: "bg-teal-500/10 text-teal-700 ring-teal-500/10 dark:text-teal-300" },
    寄养: { icon: Home, className: "bg-pink-500/10 text-pink-700 ring-pink-500/10 dark:text-pink-300" },
    其他: { icon: CircleDollarSign, className: fallback.className },
  },
};

const sizes = {
  sm: "size-9 rounded-xl",
  md: "size-11 rounded-2xl",
  lg: "size-12 rounded-2xl",
};

const iconSizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-5",
};

export function TypeIcon({ kind, type, size = "md", className }: { kind: TypeKind; type: string; size?: keyof typeof sizes; className?: string }) {
  const meta = typeIcons[kind][type] || fallback;
  const Icon = meta.icon;
  return (
    <span className={cn("grid shrink-0 place-items-center ring-1 ring-inset", sizes[size], meta.className, className)}>
      <Icon className={iconSizes[size]} />
    </span>
  );
}
