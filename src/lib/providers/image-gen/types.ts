import type { VisualCategoryKey } from "@/lib/generation/visual-category";

export type ImageSlotRole =
  | "hero"
  | "texture_detail"
  | "usage_context"
  | "feature_support"
  | "package_shot"
  | "lifestyle_scene"
  | "detail_macro";

export interface ImageGenInput {
  prompt: string;
  aspect?: "square" | "landscape" | "portrait";
  slotRole?: ImageSlotRole;
  categoryKey?: VisualCategoryKey;
}

export interface ImageGenProvider {
  generate(input: ImageGenInput): Promise<string>;
}
