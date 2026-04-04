import type { VisualCategoryKey } from "@/lib/generation/visual-category";

export type ImageSlotRole =
  | "hero"
  | "texture_detail"
  | "usage_context"
  | "feature_support";

export interface ImageGenInput {
  prompt: string;
  aspect?: "square" | "landscape" | "portrait";
  /** Layout slot — drives prompt structure in commerce pipeline */
  slotRole?: ImageSlotRole;
  /** Inferred vertical — mock stock + prompt grounding */
  categoryKey?: VisualCategoryKey;
}

export interface ImageGenProvider {
  generate(input: ImageGenInput): Promise<string>;
}
