import OpenAI from "openai";
import type { TextGenInput, TextGenOutput, TextGenProvider } from "./types";

export class OpenAITextGenProvider implements TextGenProvider {
  constructor(private readonly client: OpenAI) {}

  async generate(input: TextGenInput): Promise<TextGenOutput> {
    const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
    const benefitCount =
      input.length === "short" ? 2 : input.length === "medium" ? 3 : 4;

    const prompt = `당신은 국내 이커머스 상세페이지 카피라이터입니다. 출력은 JSON만 허용합니다(마크다운 금지).
필드: headline, subcopy, benefits(${benefitCount}개 객체 배열, 각 title/body), scenarioTitle, scenarioBody, ctaTitle, ctaBody.

서사: 관심을 끄는 헤드라인 → 서브카피에서 고객 상황과 해결 → 혜택 섹션은 각각 판매용 소제목(진부한 '검증된 품질'류 지양) → 시나리오는 일상 속 사용 맥락 → CTA는 행동을 부드럽게 유도.
톤: ${input.tone}.
상품: ${input.productDescription}
타겟: ${input.targetCustomer || "미지정"}
색·무드 힌트: ${input.colorHint || "미지정"}
강조할 점: ${input.sellingPoints || "미지정"}

규칙: 자연스러운 한국어, 문장은 짧고 명확하게, 과장 광고체 금지, 기술/개발/메타 설명 금지, 실제 쇼핑몰 상세페이지에 붙여넣을 수 있는 수준으로 작성.`;

    const res = await this.client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = res.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty OpenAI response");

    const parsed = JSON.parse(raw) as TextGenOutput;
    if (!parsed.headline || !parsed.benefits?.length) {
      throw new Error("Invalid OpenAI JSON shape");
    }
    return parsed;
  }
}
