export const IMAGE_VARIANTS = {
  thumb: { suffix: "thumb" },
  medium: { suffix: "medium" },
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

export function imageVariantUrl(url?: string | null, variant: ImageVariant = "medium") {
  if (!url?.startsWith("/uploads/")) return url || "";
  const dot = url.lastIndexOf(".");
  if (dot <= "/uploads/".length) return url;
  return `${url.slice(0, dot)}-${IMAGE_VARIANTS[variant].suffix}.webp`;
}
