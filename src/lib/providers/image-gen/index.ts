import OpenAI from "openai";
import { imageGenProvider } from "@/lib/env";
import { MockImageGenProvider } from "./mock";
import { OpenAIImageGenProvider } from "./openai";
import type { ImageGenProvider } from "./types";

export type * from "./types";

export function getImageGenProvider(): ImageGenProvider {
  if (imageGenProvider() === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAIImageGenProvider(
      new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    );
  }
  return new MockImageGenProvider();
}
