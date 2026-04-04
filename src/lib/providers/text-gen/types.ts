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
}

export interface TextGenOutput {
  headline: string;
  subcopy: string;
  benefits: { title: string; body: string }[];
  scenarioTitle: string;
  scenarioBody: string;
  ctaTitle: string;
  ctaBody: string;
}

export interface TextGenProvider {
  generate(input: TextGenInput): Promise<TextGenOutput>;
}
