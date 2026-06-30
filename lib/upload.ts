import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { IMAGE_VARIANTS, type ImageVariant } from "@/lib/image-variants";

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

const variantSettings: Record<ImageVariant, { width: number; quality: number }> = {
  thumb: { width: 480, quality: 72 },
  medium: { width: 1280, quality: 78 },
};

export async function saveImage(file: File) {
  if (!allowed.has(file.type)) throw new Error("仅支持 JPG、PNG、WebP 图片");
  if (file.size > 10 * 1024 * 1024) throw new Error("图片不能超过 10MB");
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const ext = allowed.get(file.type)!;
  const base = `${Date.now()}-${crypto.randomUUID()}`;
  const name = `${base}.${ext}`;
  const data = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), data);
  await createImageVariants(data, dir, base);
  return `/uploads/${name}`;
}

export async function deleteImage(url?: string | null) {
  if (!url?.startsWith("/uploads/")) return;
  const name = url.slice("/uploads/".length);
  if (!name || name !== path.basename(name)) return;
  const dir = uploadDir();
  const base = name.slice(0, -path.extname(name).length);
  const names = [name, ...Object.values(IMAGE_VARIANTS).map((variant) => `${base}-${variant.suffix}.webp`)];
  await Promise.all(names.map(async (item) => {
    try {
      await unlink(path.join(dir, item));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }));
}

async function createImageVariants(data: Buffer, dir: string, base: string) {
  await Promise.all(Object.entries(variantSettings).map(async ([variant, settings]) => {
    await sharp(data)
      .rotate()
      .resize({ width: settings.width, withoutEnlargement: true })
      .webp({ quality: settings.quality })
      .toFile(path.join(dir, `${base}-${IMAGE_VARIANTS[variant as ImageVariant].suffix}.webp`));
  }));
}

export async function ensureImageVariant(file: string) {
  try {
    await access(file);
    return file;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const parsed = parseVariantName(path.basename(file));
  if (!parsed) return file;

  const dir = path.dirname(file);
  const source = await findVariantSource(dir, parsed.base);
  if (!source) return file;

  const data = await sharp(source)
    .rotate()
    .resize({ width: variantSettings[parsed.variant].width, withoutEnlargement: true })
    .webp({ quality: variantSettings[parsed.variant].quality })
    .toBuffer();
  await writeFile(file, data);
  return file;
}

function parseVariantName(name: string): { base: string; variant: ImageVariant } | null {
  for (const [variant, meta] of Object.entries(IMAGE_VARIANTS) as [ImageVariant, typeof IMAGE_VARIANTS[ImageVariant]][]) {
    const suffix = `-${meta.suffix}.webp`;
    if (name.endsWith(suffix)) return { base: name.slice(0, -suffix.length), variant };
  }
  return null;
}

async function findVariantSource(dir: string, base: string) {
  for (const ext of allowed.values()) {
    const file = path.join(dir, `${base}.${ext}`);
    try {
      await access(file);
      return file;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return null;
}
