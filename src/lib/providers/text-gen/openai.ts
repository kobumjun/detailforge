import OpenAI from "openai";
import type { TextGenInput, TextGenOutput, TextGenProvider } from "./types";

export class OpenAITextGenProvider implements TextGenProvider {
  constructor(private readonly client: OpenAI) {}

  async generate(input: TextGenInput): Promise<TextGenOutput> {
    const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
    const benefitCount =
      input.length === "short" ? 2 : input.length === "medium" ? 3 : 4;
    const statsCount = input.length === "short" ? 2 : 3;
    const compareRows = input.length === "short" ? 2 : 3;

    const prompt = `한국 이커머스 상세페이지 카피라이터. JSON만 출력(마크다운 금지).
카테고리 키: ${input.categoryKey} — 문체·어휘를 이 카테고리(식품/뷰티/테크/패션/펫 등)에 맞춰라.

필드:
- headline: 상품명 중심 한 줄 헤드라인(과장 금지)
- subcopy: 2~3문장, 구매 결정에 도움
- painBody: "왜 이 제품이 필요한가"에 답하는 본문 2~3문장
- badges: 문자열 배열 3개, 짧은 배지 문구
- benefits: ${benefitCount}개 {title, body} — 제목은 "한눈에 보는 핵심 포인트", "이렇게 달라집니다" 같은 실제 상세페이지 톤
- stats: ${statsCount}개 {value, label} — 예시 수치(허구 가능하나 과하지 않게)
- checklist: 3~4개 문자열
- comparison: ${compareRows}개 {label, ours, typical}
- scenarioTitle, scenarioBody, scenarioAside
- recommendBody: "이런 분께 추천" 본문
- quoteText, quoteFrom
- noticeLines: 2~3개 안내 문장
- compositionItems: 3개 구성 항목
- ctaTitle, ctaBody

상품: ${input.productDescription}
타겟: ${input.targetCustomer || "미지정"}
톤: ${input.tone}
색·무드: ${input.colorHint || "미지정"}
강조: ${input.sellingPoints || "미지정"}

금지: 개발자 말투, 메타 설명, "AI가 생성" 류.`;

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
    if (!parsed.painBody) {
      parsed.painBody = parsed.subcopy.slice(0, 200);
    }
    if (!parsed.badges?.length) {
      parsed.badges = ["공식 구성", "빠른 발송", "문의 지원"];
    }
    if (!parsed.stats?.length) {
      parsed.stats = [{ value: "4.8", label: "만족도" }];
    }
    if (!parsed.checklist?.length) {
      parsed.checklist = ["본품", "구성 확인", "배송 안내"];
    }
    if (!parsed.comparison?.length) {
      parsed.comparison = [
        { label: "품질", ours: "검수", typical: "편차" },
      ];
    }
    if (!parsed.scenarioAside) parsed.scenarioAside = "";
    if (!parsed.quoteText) parsed.quoteText = "기대 이상이에요.";
    if (!parsed.quoteFrom) parsed.quoteFrom = "구매 고객";
    if (!parsed.noticeLines?.length) {
      parsed.noticeLines = ["제품 이미지는 모니터와 차이가 있을 수 있습니다."];
    }
    if (!parsed.compositionItems?.length) {
      parsed.compositionItems = ["본품", "구성품", "안내서"];
    }
    return parsed;
  }
}
