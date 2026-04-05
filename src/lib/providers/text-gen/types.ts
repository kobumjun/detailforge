import type { VisualCategoryKey } from "@/lib/generation/visual-category";

export type ToneOption =
  | "premium"
  | "emotional"
  | "minimal"
  | "aggressive";

export type DetailLength = "short" | "medium" | "long";

export interface TextGenInput {
  productDescription: string;
  targetCustomer?: string;
  tone: ToneOption;
  colorHint?: string;
  sellingPoints?: string;
  length: DetailLength;
  categoryKey: VisualCategoryKey;
}

export interface TextGenOutput {
  headline: string;
  subcopy: string;
  painBody: string;
  badges: string[];
  benefits: { title: string; body: string }[];
  stats: { value: string; label: string }[];
  checklist: string[];
  comparison: { label: string; ours: string; typical: string }[];
  scenarioTitle: string;
  scenarioBody: string;
  scenarioAside: string;
  recommendBody: string;
  quoteText: string;
  quoteFrom: string;
  noticeLines: string[];
  compositionItems: string[];
  ctaTitle: string;
  ctaBody: string;
}

export interface TextGenProvider {
  generate(input: TextGenInput): Promise<TextGenOutput>;
}
