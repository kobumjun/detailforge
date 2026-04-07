import type { ImageSlotRole } from "@/lib/providers/image-gen/types";
import type { VisualCategoryProfile } from "./visual-category";

const SLOT_GUIDE: Record<ImageSlotRole, string> = {
  hero:
    "Wide ecommerce hero: flagship product centered in a real studio-like scene, natural depth and physically plausible surfaces.",
  texture_detail:
    "Macro close-up of material, surface, finish, or ingredient texture from the same product category only.",
  usage_context:
    "Lifestyle scene where this exact product category is naturally used; props must match the vertical and stay minimal.",
  feature_support:
    "Supporting still life reinforcing a selling claim; only category-consistent, low-noise props.",
  package_shot:
    "Retail box, bundle, or kit flatlay for the described product only, without readable package text.",
  lifestyle_scene:
    "Authentic desk/gym/kitchen/bathroom context matching the product category; hero product clearly visible, no stylized CGI look.",
  detail_macro:
    "Tight product detail: ports, buttons, material texture zoom — same merchandise category only.",
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
    "Realistic commercial product photo, natural lighting, clean ecommerce visual, non-stylized, minimal artificial effects.",
    opts.category.imagePromptPrefix,
    SLOT_GUIDE[opts.slotRole],
    `Merchandise: "${product}".`,
    target ? `Buyer: ${target}.` : "",
    points ? `Claims: ${points}.` : "",
    sec ? `Section: ${sec}.` : "",
    body ? `Context: ${body}.` : "",
    "Forbidden: unrelated salons, random food, generic sale banners, stock photos of wrong industries, oceans/forests as main subject.",
    "Forbidden inside image: text, typography, letters, numbers, logos, watermark, brand mark, label text, package copy.",
    "Use plain unlabeled packaging and clean surfaces only. Avoid fake glyphs and unreadable characters.",
    "Avoid excessive props, heavy CGI rendering, dramatic glow, neon effects, and over-processed contrast.",
    "Photorealistic, commercially retouched but natural, sharp focus.",
  ];

  return parts.filter(Boolean).join(" ");
}
