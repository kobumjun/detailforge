import OpenAI from "openai";
import { logImageSrcContext } from "@/lib/generation/image-url-utils";
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

    const grounded = [
      "Depict only the described product category. No unrelated nature landscapes, oceans, forests, or generic scenery.",
      "No text, no typography, no letters, no numbers, no logos, no watermark, no label text.",
      "Realistic commercial product photo, natural lighting, clean ecommerce visual, non-stylized, minimal artificial effects.",
      input.prompt,
    ]
      .join(" ")
      .slice(0, 3800);

    const res = await this.client.images.generate({
      model,
      prompt: grounded,
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
      n: 1,
    });

    const first = res.data?.[0];
    const url = first?.url ?? undefined;
    const b64 = first?.b64_json ?? undefined;

    if (typeof url === "string" && url.length > 0) {
      logImageSrcContext("provider:openai:url", url);
      return url;
    }
    if (typeof b64 === "string" && b64.length > 0) {
      console.info("[generation:image-src] provider:openai", {
        ok: true,
        kind: "b64_json",
        model,
      });
      return `data:image/png;base64,${b64}`;
    }

    console.warn("[generation:image-src] provider:openai", {
      ok: false,
      reason: "no_url_or_b64",
      dataLength: res.data?.length ?? 0,
    });
    throw new Error("No image URL or b64_json from OpenAI");
  }
}
