import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, differenceInMonths, format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: Date | string, pattern = "yyyy年M月d日") {
  return format(new Date(value), pattern, { locale: zhCN });
}

export function formatDateTime(value: Date | string) {
  return format(new Date(value), "M月d日 HH:mm", { locale: zhCN });
}

export function money(cents: number) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(cents / 100);
}

export function dogAge(birthDate: Date | string) {
  const months = Math.max(0, differenceInMonths(new Date(), new Date(birthDate)));
  if (months < 12) return `${months} 个月`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} 岁 ${rest} 个月` : `${years} 岁`;
}

export function daysTogether(adoptionDate?: Date | string | null) {
  if (!adoptionDate) return null;
  return Math.max(1, differenceInCalendarDays(new Date(), new Date(adoptionDate)) + 1);
}

export function toDateInput(value?: Date | string | null) {
  return value ? format(new Date(value), "yyyy-MM-dd") : "";
}

export function toDateTimeInput(value?: Date | string | null) {
  return value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : "";
}
