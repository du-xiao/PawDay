"use client";

import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { imageVariantUrl } from "@/lib/image-variants";

export function LogImageViewer({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="group relative mt-4 block aspect-[16/8] w-full max-w-xl overflow-hidden rounded-2xl bg-black/[.04] text-left">
      <Image src={imageVariantUrl(src, "medium")} alt={alt} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="600px" />
      <span className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/35 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#2d2924] shadow-lg"><Maximize2 className="size-3.5" />查看完整图片</span>
      </span>
    </button>

    {open && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 backdrop-blur-md" onClick={() => setOpen(false)}>
      <button type="button" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" onClick={() => setOpen(false)}><X className="size-5" /><span className="sr-only">关闭</span></button>
      <div className="relative h-[86vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-black shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <Image src={imageVariantUrl(src, "medium")} alt={alt} fill unoptimized className="object-contain" sizes="100vw" />
      </div>
    </div>, document.body)}
  </>;
}
