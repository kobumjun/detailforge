import OpenAI from "openai";
import { imageGenProvider } from "@/lib/env";
import { MockImageGenProvider } from "./mock";
import { OpenAIImageGenProvider } from "./openai";
import type { ImageGenProvider } from "./types";

export type * from "./types";

export function getImageGenProvider(): ImageGenProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (imageGenProvider() === "openai" && apiKey) {
    return new OpenAIImageGenProvider(new OpenAI({ apiKey }));
  }
  return new MockImageGenProvider();
}
