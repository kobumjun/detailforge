import type { ImageSlotRole } from "@/lib/providers/image-gen/types";
import type { VisualCategoryProfile } from "./visual-category";

const SLOT_GUIDE: Record<ImageSlotRole, string> = {
  hero:
    "Wide ecommerce hero: flagship product centered, premium catalog cover, soft studio gradient backdrop.",
  texture_detail:
    "Macro close-up of material, surface, packaging detail, or ingredient texture — same product category only.",
  usage_context:
    "Lifestyle scene where this exact product category is used; props must match the vertical (no salon/salad for PC peripherals).",
  feature_support:
    "Supporting still life reinforcing a selling claim; only category-consistent props.",
  package_shot:
    "Retail box, bundle, or kit flatlay showing package design and contents silhouette for the described product only.",
  lifestyle_scene:
    "Authentic desk/gym/kitchen/bathroom context matching the product category; hero product clearly visible.",
  detail_macro:
    "Tight product detail: ports, buttons, label, texture zoom — must be the same merchandise category.",
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
    "Strict ecommerce product photography. The subject MUST match the described product type.",
    opts.category.imagePromptPrefix,
    SLOT_GUIDE[opts.slotRole],
    `Merchandise: "${product}".`,
    target ? `Buyer: ${target}.` : "",
    points ? `Claims: ${points}.` : "",
    sec ? `Section: ${sec}.` : "",
    body ? `Context: ${body}.` : "",
    "Forbidden: unrelated salons, random food, generic sale banners, stock photos of wrong industries, oceans/forests as main subject.",
    "Photorealistic, commercial lighting, sharp focus.",
  ];

  return parts.filter(Boolean).join(" ");
}
