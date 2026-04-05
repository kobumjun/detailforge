import OpenAI from "openai";
import { textGenProvider } from "@/lib/env";
import { MockTextGenProvider } from "./mock";
import { OpenAITextGenProvider } from "./openai";
import type { TextGenProvider } from "./types";

export type * from "./types";

export function getTextGenProvider(): TextGenProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (textGenProvider() === "openai" && apiKey) {
    return new OpenAITextGenProvider(new OpenAI({ apiKey }));
  }
  return new MockTextGenProvider();
}
