import type { ImageSlotRole } from "@/lib/providers/image-gen/types";
import type { VisualCategoryProfile } from "./visual-category";

const SLOT_GUIDE: Record<ImageSlotRole, string> = {
  hero:
    "Wide ecommerce hero: flagship product or neatly arranged set, centered composition, soft studio gradient or seamless backdrop, premium catalog cover.",
  texture_detail:
    "Macro or tight crop: packaging detail, ingredient texture, fabric weave, material finish, or product surface — must relate to the same product category.",
  usage_context:
    "Lifestyle-in-context: believable everyday scene where this product category would appear; props stay in the same vertical.",
  feature_support:
    "Supporting still life that visually backs the selling point; secondary props only from the same product world.",
};

export function buildCommerceImagePrompt(opts: {
  slotRole: ImageSlotRole;
  productDescription: string;
  targetCustomer?: string;
  sellingPoints?: string;
  category: VisualCategoryProfile;
  sectionTitle?: string;
  sectionBody?: string;
}): string {
  const product = opts.productDescription.trim().slice(0, 220);
  const target = opts.targetCustomer?.trim().slice(0, 100);
  const points = opts.sellingPoints?.trim().slice(0, 160);
  const sec = opts.sectionTitle?.trim().slice(0, 80);
  const body = opts.sectionBody?.trim().slice(0, 140);

  const parts = [
    "Commercial product photography for an online store detail page.",
    opts.category.imagePromptPrefix,
    SLOT_GUIDE[opts.slotRole],
    `Primary merchandise (keep subject aligned): "${product}".`,
    target ? `Intended buyer: ${target}.` : "",
    points ? `Brand claims to reflect visually: ${points}.` : "",
    sec ? `Section headline: ${sec}.` : "",
    body ? `Supporting copy cue: ${body}.` : "",
    "Do not depict oceans, forests, deserts, mountains, sky-only, or generic travel scenery unrelated to the product.",
    "Photorealistic lighting, sharp focus, high-end retail aesthetic.",
  ];

  return parts.filter(Boolean).join(" ");
}
