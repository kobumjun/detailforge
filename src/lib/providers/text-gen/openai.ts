import OpenAI from "openai";
import type { TextGenInput, TextGenOutput, TextGenProvider } from "./types";

export class OpenAITextGenProvider implements TextGenProvider {
  constructor(private readonly client: OpenAI) {}

  async generate(input: TextGenInput): Promise<TextGenOutput> {
    const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
    const benefitCount =
      input.length === "short" ? 2 : input.length === "medium" ? 3 : 4;

    const prompt = `You are a Korean e-commerce copywriter. Output STRICT JSON only, no markdown.
Keys: headline, subcopy, benefits (array of ${benefitCount} objects with title, body), scenarioTitle, scenarioBody, ctaTitle, ctaBody.
Tone: ${input.tone}. Product: ${input.productDescription}.
Target customer (optional): ${input.targetCustomer || "n/a"}.
Color mood (optional): ${input.colorHint || "n/a"}.
Selling points (optional): ${input.sellingPoints || "n/a"}.
Language: Korean. Keep copy polished for a vertical long-form product detail page.`;

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
