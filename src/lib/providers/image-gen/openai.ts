import OpenAI from "openai";
import type { ImageGenInput, ImageGenProvider } from "./types";

export class OpenAIImageGenProvider implements ImageGenProvider {
  constructor(private readonly client: OpenAI) {}

  async generate(input: ImageGenInput): Promise<string> {
    const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
    const size =
      input.aspect === "portrait"
        ? "1024x1792"
        : input.aspect === "landscape"
          ? "1792x1024"
          : "1024x1024";

    const res = await this.client.images.generate({
      model,
      prompt: input.prompt.slice(0, 3500),
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
      n: 1,
    });

    const url = res.data?.[0]?.url;
    if (!url) throw new Error("No image URL from OpenAI");
    return url;
  }
}
