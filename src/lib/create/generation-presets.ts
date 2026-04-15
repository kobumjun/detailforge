import type { TemplateId } from "@/lib/generation/types";
import type { DetailLength, ToneOption } from "@/lib/providers/text-gen/types";

export type VariantPresetId =
  | "simple_tone"
  | "premium_tone"
  | "strong_cta"
  | "female_target"
  | "gift_set"
  | "smartstore"
  | "coupang";

export type GenerationFieldPatch = {
  tone: ToneOption;
  targetCustomer?: string;
  sellingPoints?: string;
  colorHint?: string;
  length: DetailLength;
  template: TemplateId;
};

const STRONG_CTA =
  "구매 전환을 높이는 강한 CTA, 혜택 요약, 한정·재고 압박 문구를 넣어 주세요.";
const GIFT =
  "선물·패키지·선물세트 구매 동기에 맞는 카피와 구성 설명을 강조해 주세요.";
const SMARTSTORE =
  "네이버 스마트스토어 상세페이지에 맞는 문체, 구성, 구매 정보 안내를 반영해 주세요.";
const COUPANG =
  "쿠팡 롱폼 상세페이지 스타일에 맞는 구성·문체·핵심 스펙 정리를 반영해 주세요.";
const FEMALE =
  "20–40대 여성 고객에게 맞는 톤과 표현으로 작성해 주세요.";

function mergeSelling(base: string | undefined, extra: string): string {
  const b = base?.trim() ?? "";
  if (!b) return extra;
  if (b.includes(extra.slice(0, 24))) return b;
  return `${b}\n${extra}`;
}

function mergeTarget(base: string | undefined, extra: string): string {
  const b = base?.trim() ?? "";
  if (!b) return extra;
  if (b.includes("여성")) return b;
  return `${b} · ${extra}`;
}

/** 서버·클라이언트 공통: 폼에서 읽은 값 위에 프리셋을 덮어씀 */
export function applyVariantPreset(
  preset: string | undefined,
  base: GenerationFieldPatch,
): GenerationFieldPatch {
  if (!preset) return base;
  const next = { ...base };
  switch (preset as VariantPresetId) {
    case "simple_tone":
      next.tone = "minimal";
      next.length = "short";
      break;
    case "premium_tone":
      next.tone = "premium";
      next.template = "aurora";
      break;
    case "strong_cta":
      next.tone = "aggressive";
      next.sellingPoints = mergeSelling(base.sellingPoints, STRONG_CTA);
      break;
    case "female_target":
      next.targetCustomer = mergeTarget(base.targetCustomer, FEMALE);
      next.tone = "emotional";
      break;
    case "gift_set":
      next.sellingPoints = mergeSelling(base.sellingPoints, GIFT);
      next.tone = "emotional";
      break;
    case "smartstore":
      next.sellingPoints = mergeSelling(base.sellingPoints, SMARTSTORE);
      next.length = "long";
      break;
    case "coupang":
      next.sellingPoints = mergeSelling(base.sellingPoints, COUPANG);
      next.length = "long";
      break;
    default:
      break;
  }
  return next;
}
