import type { TextGenInput, TextGenOutput, TextGenProvider } from "./types";

const tonePhrases: Record<string, { lead: string; cta: string }> = {
  premium: {
    lead: "기대 이상의 완성도",
    cta: "지금 바로 만나보세요",
  },
  emotional: {
    lead: "하루를 바꾸는 작은 디테일",
    cta: "당신의 일상에 담아보세요",
  },
  minimal: {
    lead: "필요한 것만, 깔끔하게",
    cta: "간결하게 선택하세요",
  },
  aggressive: {
    lead: "지금이 가장 합리적인 순간",
    cta: "망설임은 재고만 줄입니다",
  },
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

    const pool = [
      {
        title: "왜 지금 이 제품인가요",
        body: `${p}는 반복 구매까지 이어지도록, 첫 사용부터 차이가 느껴지게 설계했습니다.`,
      },
      {
        title: "이렇게 달라집니다",
        body: target
          ? `${target}의 루틴에 맞춰 불편을 줄이고, 기대했던 결과에 더 빨리 도달하도록 구성했습니다.`
          : "매일 쓰는 순간마다 체감되는 편안함과 만족에 초점을 맞췄습니다.",
      },
      {
        title: "믿고 고를 수 있는 이유",
        body: "성분·소재·마감까지 꼼꼼히 관리해, 한 번이 아니라 오래 함께할 수 있는 품질을 지향합니다.",
      },
      {
        title: "부담 없이 시작하세요",
        body: "처음엔 가볍게, 익숙해질수록 확신이 생기도록 사용 흐름을 단순하게 잡았습니다.",
      },
    ];

    for (let i = 0; i < benefitCount; i++) {
      benefits.push({ ...pool[i % pool.length]! });
    }

    if (accent) {
      benefits[0] = {
        title: "한눈에 보는 핵심",
        body: accent,
      };
    }

    const colorLine = color
      ? ` ${color} 톤을 염두에 두고 구성했습니다.`
      : "";

    return {
      headline: `${p} · ${tone.lead}`,
      subcopy: `비슷한 선택지 사이에서 고민이 길어질수록, 작은 차이가 큰 만족으로 이어집니다.${target ? ` ${target}에게 특히 잘 맞도록 정리했습니다.` : ""}${colorLine}`,
      benefits,
      scenarioTitle: "이럴 때 가장 잘 맞아요",
      scenarioBody:
        input.length === "short"
          ? "바쁜 아침, 짧은 휴식, 주말 루틴까지. 자주 마주치는 순간에 자연스럽게 스며듭니다."
          : "평일은 빠르게, 주말은 여유롭게. 사용 환경이 바뀌어도 부담 없이 이어지도록 구성했습니다.",
      ctaTitle: tone.cta,
      ctaBody:
        "배송·교환·문의 등 궁금한 점은 언제든 남겨 주세요. 빠르게 안내드리겠습니다.",
    };
  }
}
