import { access, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
const sourceExts = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const variants = {
  thumb: { suffix: "thumb", width: 480, quality: 72 },
  medium: { suffix: "medium", width: 1280, quality: 78 },
};

function isVariant(name) {
  return Object.values(variants).some((variant) => name.endsWith(`-${variant.suffix}.webp`));
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function generate(source, target, settings) {
  await sharp(source)
    .rotate()
    .resize({ width: settings.width, withoutEnlargement: true })
    .webp({ quality: settings.quality })
    .toBuffer()
    .then((data) => writeFile(target, data));
}

let scanned = 0;
let created = 0;
let skipped = 0;
let failed = 0;

const entries = await readdir(uploadDir, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile() || isVariant(entry.name)) continue;
  const ext = path.extname(entry.name).toLowerCase();
  if (!sourceExts.has(ext)) continue;
  scanned += 1;

  const source = path.join(uploadDir, entry.name);
  const base = entry.name.slice(0, -ext.length);
  for (const settings of Object.values(variants)) {
    const target = path.join(uploadDir, `${base}-${settings.suffix}.webp`);
    if (await exists(target)) {
      skipped += 1;
      continue;
    }
    try {
      await generate(source, target, settings);
      created += 1;
    } catch (error) {
      failed += 1;
      console.warn(`[pawday] 生成失败: ${entry.name} -> ${path.basename(target)}: ${error?.message || error}`);
    }
  }
}

console.log(`[pawday] 图片派生图完成：扫描 ${scanned} 张，新增 ${created} 个，已存在 ${skipped} 个，失败 ${failed} 个。`);
if (failed > 0) process.exitCode = 1;
