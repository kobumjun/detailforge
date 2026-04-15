import type {
  GenerationPayload,
  TemplateId,
} from "@/lib/generation/types";
import { isPayloadV2 } from "@/lib/generation/types";
import type { DetailLength, ToneOption } from "@/lib/providers/text-gen/types";

const TONE_KO: Record<ToneOption, string> = {
  premium: "프리미엄",
  emotional: "감성",
  minimal: "미니멀",
  aggressive: "판매형",
};

const LENGTH_KO: Record<DetailLength, string> = {
  short: "짧은",
  medium: "보통",
  long: "긴",
};

const TEMPLATE_KO: Record<TemplateId, string> = {
  aurora: "Aurora",
  minimal: "Minimal",
  editorial: "Editorial",
};

const PRESET_KO: Record<string, string> = {
  simple_tone: "심플 톤",
  premium_tone: "프리미엄 톤",
  strong_cta: "CTA 강화",
  female_target: "여성 타겟형",
  gift_set: "선물세트형",
  smartstore: "스마트스토어형",
  coupang: "쿠팡형",
};

export function buildGenerationSummaryLines(
  payload: GenerationPayload,
  opts: {
    tone: ToneOption;
    length: DetailLength;
    template: TemplateId;
    imageCount: number;
    aiFillImages: boolean;
    preset?: string;
  },
): string[] {
  const lines: string[] = [];
  lines.push(`${TONE_KO[opts.tone] ?? opts.tone} 톤 · ${LENGTH_KO[opts.length]} 길이 · ${TEMPLATE_KO[opts.template]} 템플릿`);

  if (opts.preset) {
    lines.push(
      `변형: ${PRESET_KO[opts.preset] ?? opts.preset}`,
    );
  }

  if (opts.imageCount > 0) {
    lines.push(`업로드 이미지 ${opts.imageCount}장 기반 레이아웃`);
  } else if (opts.aiFillImages) {
    lines.push("비주얼 자동 보완으로 이미지 구성");
  }

  if (isPayloadV2(payload)) {
    const hasCta = payload.blocks.some((b) => b.type === "cta_band");
    if (hasCta) lines.push("하단 CTA 블록 포함");
    const nCheck = payload.blocks.find((b) => b.type === "checklist_icons");
    if (nCheck?.items?.length) {
      lines.push(`핵심 포인트 ${nCheck.items.filter(Boolean).length}개 구성`);
    }
  } else {
    const hasCta = payload.sections.some((s) => s.kind === "cta");
    if (hasCta) lines.push("CTA 섹션 포함");
  }

  return lines;
}
