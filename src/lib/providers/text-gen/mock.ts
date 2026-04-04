import type { TextGenInput, TextGenOutput, TextGenProvider } from "./types";

const tonePhrases: Record<string, { lead: string; cta: string }> = {
  premium: { lead: "프리미엄의 기준을 다시 세우다", cta: "지금, 특별한 경험을 시작하세요" },
  emotional: { lead: "일상에 스며드는 작은 행복", cta: "당신의 하루를 함께합니다" },
  minimal: { lead: "필요한 것만, 정확하게", cta: "간결한 선택, 오래가는 만족" },
  aggressive: { lead: "지금 결정하면 차이가 납니다", cta: "한정 혜택, 놓치지 마세요" },
};

export class MockTextGenProvider implements TextGenProvider {
  async generate(input: TextGenInput): Promise<TextGenOutput> {
    const p = input.productDescription.trim();
    const target = input.targetCustomer?.trim();
    const tone = tonePhrases[input.tone] ?? tonePhrases.premium;
    const accent = input.sellingPoints?.trim();
    const color = input.colorHint?.trim();

    const benefitCount =
      input.length === "short" ? 2 : input.length === "medium" ? 3 : 4;

    const benefits: TextGenOutput["benefits"] = [];
    const templates = [
      {
        title: "검증된 품질",
        body: `${p}는 엄선된 재료와 공정으로 완성되어, 매 사용마다 일관된 만족을 드립니다.`,
      },
      {
        title: "체감되는 차이",
        body: target
          ? `${target}에게 특히 잘 맞도록 설계되어, 사용 순간부터 차별점이 분명합니다.`
          : "사용 순간부터 느껴지는 차별화된 완성도를 목표로 합니다.",
      },
      {
        title: "편안한 일상",
        body: "바쁜 일상 속에서도 부담 없이 누릴 수 있도록, 사용성과 관리 편의를 고려했습니다.",
      },
      {
        title: "지속 가능한 선택",
        body: "한 번이 아니라 꾸준히 찾게 되는 이유가 있는, 오래 가는 가치를 담았습니다.",
      },
    ];

    for (let i = 0; i < benefitCount; i++) {
      benefits.push(templates[i % templates.length]);
    }

    if (accent) {
      benefits[0] = {
        title: "핵심 포인트",
        body: accent,
      };
    }

    const palette = color ? ` 컬러 무드: ${color}.` : "";

    return {
      headline: `${p} — ${tone.lead}`,
      subcopy: `${target ? `${target}을 위한 ` : ""}세심하게 다듬은 구성.${palette} 지금 바로 경험해보세요.`,
      benefits,
      scenarioTitle: "이런 순간에 특히 빛납니다",
      scenarioBody:
        input.length === "short"
          ? "출근 전 준비, 퇴근 후 휴식. 작은 루틴이 달라질 때 만족도는 커집니다."
          : "바쁜 아침 준비부터 주말 여유까지. 다양한 상황에서도 자연스럽게 스며들며, 사용할수록 익숙해지는 편안함을 지향합니다.",
      ctaTitle: tone.cta,
      ctaBody:
        "궁금한 점이 있다면 언제든 문의해 주세요. 빠르게 도와드리겠습니다.",
    };
  }
}
