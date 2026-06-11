"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

type DateInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  type?: "date" | "datetime-local";
};

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

function parseValue(value: string) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0] = (timePart || "").split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  return Number.isNaN(date.getTime()) ? null : date;
}

function displayValue(value: string, withTime: boolean) {
  const date = parseValue(value);
  if (!date) return "请选择日期";
  return format(date, withTime ? "yyyy年M月d日 HH:mm" : "yyyy年M月d日", { locale: zhCN });
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, type = "date", name, defaultValue, onChange, onBlur, disabled, ...props }, ref) => {
    const hiddenRef = React.useRef<HTMLInputElement | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ left: 8, top: 8, width: 310 });
    const [value, setValue] = React.useState(String(defaultValue || ""));
    const selected = parseValue(value);
    const [viewMonth, setViewMonth] = React.useState(selected || new Date());
    const withTime = type === "datetime-local";
    const Icon = withTime ? Clock3 : CalendarDays;

    const updatePosition = React.useCallback(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const edge = 8;
      const gap = 8;
      const width = Math.min(310, window.innerWidth - edge * 2);
      const panelHeight = panelRef.current?.offsetHeight ?? (withTime ? 370 : 310);
      const left = Math.min(Math.max(edge, rect.right - width), window.innerWidth - width - edge);
      const spaceBelow = window.innerHeight - rect.bottom - edge;
      const top = spaceBelow >= panelHeight
        ? rect.bottom + gap
        : Math.max(edge, rect.top - panelHeight - gap);
      setPosition({ left, top, width });
    }, [withTime]);

    React.useLayoutEffect(() => {
      if (!open) return;
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }, [open, updatePosition]);

    React.useEffect(() => {
      if (!open) return;
      function closeOnOutsideClick(event: PointerEvent) {
        const target = event.target as Node;
        if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
        setOpen(false);
        onBlur?.({} as React.FocusEvent<HTMLInputElement>);
      }
      document.addEventListener("pointerdown", closeOnOutsideClick);
      return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
    }, [onBlur, open]);

    function setRef(node: HTMLInputElement | null) {
      hiddenRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
      if (node) queueMicrotask(() => setValue(node.value));
    }

    function commit(nextDate: Date, close = !withTime) {
      const nextValue = format(nextDate, withTime ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd");
      setValue(nextValue);
      if (hiddenRef.current) hiddenRef.current.value = nextValue;
      onChange?.({ target: { name, value: nextValue }, type: "change" } as React.ChangeEvent<HTMLInputElement>);
      if (close) setOpen(false);
    }

    function selectDay(day: Date) {
      const next = new Date(day);
      next.setHours(selected?.getHours() ?? new Date().getHours(), selected?.getMinutes() ?? 0, 0, 0);
      commit(next);
    }

    function selectTime(part: "hour" | "minute", amount: number) {
      const next = selected ? new Date(selected) : new Date();
      if (part === "hour") next.setHours(amount);
      else next.setMinutes(amount);
      next.setSeconds(0, 0);
      commit(next, false);
    }

    const calendarStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const currentHour = selected?.getHours() ?? new Date().getHours();
    const currentMinute = selected?.getMinutes() ?? 0;

    return <div className="relative">
      <input ref={setRef} type="hidden" name={name} defaultValue={defaultValue} {...props} />
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          const current = parseValue(value);
          setViewMonth(current || new Date());
          setOpen(true);
        }}
        className={cn(
          "group flex h-12 w-full items-center gap-3 rounded-2xl border bg-white/65 px-3 text-left text-sm outline-none transition",
          "hover:border-orange-200 hover:bg-white/85 focus:border-orange-300 focus:ring-4 focus:ring-orange-100/60 disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-white/[.045] dark:hover:border-orange-700/60 dark:hover:bg-white/[.065] dark:focus:ring-orange-900/30",
          className,
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--orange-soft)] text-[var(--orange)] transition group-hover:scale-105"><Icon className="size-4" /></span>
        <span className={cn("min-w-0 flex-1 truncate font-medium", !value && "text-[var(--muted)]")}>{displayValue(value, withTime)}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-[var(--muted)] transition", open && "rotate-180")} />
      </button>

      {open && typeof document !== "undefined" && createPortal(<>
        <div
          ref={panelRef}
          role="dialog"
          aria-label="选择日期"
          style={{ left: position.left, top: position.top, width: position.width }}
          onPointerDown={(event) => event.stopPropagation()}
          className="pointer-events-auto fixed z-[70] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl border bg-[var(--background)] p-3 shadow-2xl shadow-stone-900/15"
        >
            <div className="mb-2 flex items-center justify-between">
              <button type="button" aria-label="上个月" onClick={() => setViewMonth((month) => addMonths(month, -1))} className="grid size-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--orange-soft)] hover:text-[var(--orange)]"><ChevronLeft className="size-4" /></button>
              <p className="text-sm font-semibold">{format(viewMonth, "yyyy年 M月", { locale: zhCN })}</p>
              <button type="button" aria-label="下个月" onClick={() => setViewMonth((month) => addMonths(month, 1))} className="grid size-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--orange-soft)] hover:text-[var(--orange)]"><ChevronRight className="size-4" /></button>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {weekDays.map((day) => <div key={day} className="grid h-7 place-items-center text-[10px] font-medium text-[var(--muted)]">{day}</div>)}
              {days.map((day) => {
                const active = selected ? isSameDay(day, selected) : false;
                const today = isSameDay(day, new Date());
                return <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "relative grid h-8 place-items-center rounded-lg text-xs transition",
                    !isSameMonth(day, viewMonth) && "text-[var(--muted)]/35",
                    !active && "hover:bg-[var(--orange-soft)] hover:text-[var(--orange)]",
                    active && "bg-[var(--orange)] font-semibold text-white shadow-md shadow-orange-300/30",
                    today && !active && "font-semibold text-[var(--orange)]",
                  )}
                >{format(day, "d")}{today && <span className={cn("absolute bottom-0.5 size-1 rounded-full", active ? "bg-white" : "bg-[var(--orange)]")} />}</button>;
              })}
            </div>

            {withTime && <div className="mt-3 flex items-center gap-2 border-t pt-3">
              <Clock3 className="size-4 text-[var(--orange)]" />
              <span className="text-xs font-medium text-[var(--muted)]">时间</span>
              <div className="ml-auto flex items-center gap-1.5">
                <select aria-label="小时" value={currentHour} onChange={(event) => selectTime("hour", Number(event.target.value))} className="h-8 rounded-lg border bg-white/60 px-2 text-xs font-medium outline-none focus:border-orange-300 dark:bg-white/[.05]">
                  {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}</option>)}
                </select>
                <span className="font-semibold text-[var(--muted)]">:</span>
                <select aria-label="分钟" value={currentMinute} onChange={(event) => selectTime("minute", Number(event.target.value))} className="h-8 rounded-lg border bg-white/60 px-2 text-xs font-medium outline-none focus:border-orange-300 dark:bg-white/[.05]">
                  {Array.from({ length: 60 }, (_, minute) => <option key={minute} value={minute}>{String(minute).padStart(2, "0")}</option>)}
                </select>
              </div>
            </div>}

          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <button type="button" onClick={() => { setViewMonth(new Date()); selectDay(new Date()); }} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--orange)] transition hover:bg-[var(--orange-soft)]">今天</button>
            {withTime && <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-[var(--orange)] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-105">完成</button>}
          </div>
        </div>
      </>, document.body)}
    </div>;
  },
);
DateInput.displayName = "DateInput";
