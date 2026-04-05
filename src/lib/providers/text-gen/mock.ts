import { voiceFor } from "@/lib/generation/commerce-voice";
import type { TextGenInput, TextGenOutput, TextGenProvider } from "./types";

const tonePhrases: Record<string, { lead: string; cta: string }> = {
  premium: { lead: "기대를 넘는 완성도", cta: "지금 바로 만나보세요" },
  emotional: { lead: "일상에 스며드는 만족", cta: "당신의 하루에 담아보세요" },
  minimal: { lead: "필요한 것만, 또렷하게", cta: "간결하게 고르세요" },
  aggressive: { lead: "지금이 가장 합리적입니다", cta: "재고는 한정입니다" },
};

export class MockTextGenProvider implements TextGenProvider {
  async generate(input: TextGenInput): Promise<TextGenOutput> {
    const p = input.productDescription.trim();
    const target = input.targetCustomer?.trim();
    const tone = tonePhrases[input.tone] ?? tonePhrases.premium;
    const accent = input.sellingPoints?.trim();
    const color = input.colorHint?.trim();
    const voice = voiceFor(input.categoryKey);

    const benefitCount =
      input.length === "short" ? 2 : input.length === "medium" ? 3 : 4;

    const pool = [
      {
        title: "한눈에 보는 핵심 포인트",
        body: accent || `${p}의 구성과 특징을 빠르게 파악할 수 있도록 정리했습니다.`,
      },
      {
        title: "이렇게 달라집니다",
        body: target
          ? `${target}의 사용 흐름에 맞춰 불편을 줄이고, 체감 만족을 높였습니다.`
          : "매일 쓰는 순간마다 느껴지는 차이에 집중했습니다.",
      },
      {
        title: "지금 선택해야 하는 이유",
        body: "비슷한 가격대에서 놓치기 쉬운 디테일까지 챙겨, 후회 없는 선택을 돕습니다.",
      },
      {
        title: "믿고 고르는 기준",
        body: "품질·구성·사용성을 한 번에 검증할 수 있도록 정보를 모았습니다.",
      },
    ];

    const benefits = pool.slice(0, benefitCount);

    const statsCount = input.length === "short" ? 2 : 3;
    const statsTemplates = [
      { value: "98%", label: "재구매 의향 응답" },
      { value: "4.8", label: "만족도 평점(예시)" },
      { value: "24h", label: "평균 출고(예시)" },
    ];
    const stats = statsTemplates.slice(0, statsCount);

    const checklist = [
      `${p} 본품`,
      target ? `${target} 사용에 맞는 구성` : "구성품·패키지 확인",
      color ? `${color} 무드 연출` : "사용 환경에 맞는 연출",
      "배송·교환 정책 확인",
    ].slice(0, input.length === "short" ? 3 : 4);

    const comparison =
      input.length === "short"
        ? [
            {
              label: "완성도",
              ours: "상세 스펙·구성 공개",
              typical: "정보 부족",
            },
            {
              label: "사용성",
              ours: "루틴에 맞춘 구성",
              typical: "일반적 구성",
            },
          ]
        : [
            {
              label: "품질 기준",
              ours: "일관된 검수·포장",
              typical: "편차 있음",
            },
            {
              label: "정보 제공",
              ours: "성분·스펙 투명",
              typical: "제한적",
            },
            {
              label: "만족 보장",
              ours: "문의·A/S 안내",
              typical: "불명확",
            },
          ];

    const quoteText =
      input.length === "long"
        ? `직접 써보니 설명 그대로였어요. ${p} 고민하던 분들께 추천합니다.`
        : `기대 이상이에요. ${p} 선택 잘한 것 같아요.`;

    const compositionItems = [...voice.compositionDefault];

    const noticeLines = [
      "제품 특성에 따라 색상·사이즈는 모니터 환경과 다소 차이가 있을 수 있습니다.",
      "개봉 후에는 단순 변심에 의한 교환이 제한될 수 있습니다.",
      "문의는 고객센터로 남겨 주시면 순차 안내드립니다.",
    ].slice(0, input.length === "long" ? 3 : 2);

    const badges = [
      "공식 구성",
      target ? `${target} 맞춤` : "검증된 구성",
      tone.lead.slice(0, 12),
    ];

    return {
      headline: `${p}`,
      subcopy: `${tone.lead}. ${target ? `${target}을 위한 ` : ""}선택의 기준을 명확히 할 수 있도록 정리했습니다.${color ? ` ${color} 톤을 염두에 둔 연출입니다.` : ""}`,
      painBody: accent
        ? `구매 전에 가장 먼저 확인하고 싶은 내용입니다. ${accent}`
        : `${p}를 고를 때 흔히 망설이는 지점—구성·품질·사용감—을 먼저 짚고 넘어갑니다.`,
      badges,
      benefits,
      stats,
      checklist,
      comparison,
      scenarioTitle: "이럴 때 가장 빛납니다",
      scenarioBody:
        "평일은 빠르게, 주말은 여유롭게. 바쁜 일정 속에서도 부담 없이 루틴에 넣을 수 있게 설계했습니다.",
      scenarioAside: "사용 환경이 바뀌어도 설정·관리는 최소한으로 유지할 수 있습니다.",
      recommendBody: `${target ? `${target}에게 특히 잘 맞습니다. ` : ""}처음 쓰는 분도 부담 없이 시작할 수 있는 구성입니다.`,
      quoteText,
      quoteFrom: voice.quoteAuthorLabel,
      noticeLines,
      compositionItems,
      ctaTitle: tone.cta,
      ctaBody:
        "배송·교환·문의는 고객센터로 남겨 주세요. 빠르게 도와드리겠습니다.",
    };
  }
}
