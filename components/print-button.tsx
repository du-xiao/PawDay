"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "打印 / 存为 PDF" }: { label?: string }) {
  return (
    <Button type="button" variant="warm" onClick={() => window.print()}>
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
