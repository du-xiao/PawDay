import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-orange-200/55 active:scale-[.98] dark:focus-visible:ring-orange-900/35",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-[#37312a] to-[#26221d] text-white shadow-lg shadow-black/10 hover:brightness-110 dark:from-[#f8f0e5] dark:to-[#e7ded0] dark:text-[#211f1b]",
        warm: "bg-gradient-to-br from-[var(--orange)] to-[#d87755] text-white shadow-lg shadow-orange-300/20 hover:brightness-105",
        secondary: "bg-[var(--orange-soft)] text-[#8d4d2f] shadow-sm shadow-orange-200/20 hover:brightness-95 dark:text-[#ffc09b]",
        outline: "border bg-[var(--card)] shadow-sm shadow-stone-900/[.03] hover:bg-black/[.03] dark:hover:bg-white/[.05]",
        ghost: "hover:bg-black/[.045] dark:hover:bg-white/[.06]",
        danger: "bg-red-500/10 text-red-600 shadow-sm shadow-red-500/5 hover:bg-red-500/15 dark:text-red-300",
      },
      size: { default: "h-11 px-5", sm: "h-9 px-3.5 rounded-xl", lg: "h-13 px-7 text-base", icon: "size-10 p-0 rounded-xl" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
