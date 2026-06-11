import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadDir } from "@/lib/upload";

const mime: Record<string,string>={".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
export async function GET(_:Request,{params}:{params:Promise<{path:string[]}>}){try{const parts=(await params).path;const root=uploadDir();const file=path.resolve(root,...parts);if(!file.startsWith(`${root}${path.sep}`))return new NextResponse("Not found",{status:404});const ext=path.extname(file).toLowerCase();if(!mime[ext])return new NextResponse("Not found",{status:404});const data=await readFile(file);return new NextResponse(data,{headers:{"Content-Type":mime[ext],"Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"}})}catch{return new NextResponse("Not found",{status:404})}}
