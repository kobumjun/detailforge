import OpenAI from "openai";
import { textGenProvider } from "@/lib/env";
import { MockTextGenProvider } from "./mock";
import { OpenAITextGenProvider } from "./openai";
import type { TextGenProvider } from "./types";

export type * from "./types";

export function getTextGenProvider(): TextGenProvider {
  if (textGenProvider() === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAITextGenProvider(
      new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    );
  }
  return new MockTextGenProvider();
}
