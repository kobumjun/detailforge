import type { DetailLength, ToneOption } from "@/lib/providers/text-gen/types";

export type TemplateId = "aurora" | "minimal" | "editorial";

export interface GenerationOptions {
  productDescription: string;
  targetCustomer?: string;
  tone: ToneOption;
  colorHint?: string;
  sellingPoints?: string;
  template: TemplateId;
  length: DetailLength;
  aiFillImages: boolean;
  /** Public URLs of user uploads (Supabase or data URLs) */
  userImageUrls: string[];
}

export type DetailSection =
  | {
      kind: "hero";
      headline: string;
      subcopy: string;
      imageUrl?: string;
    }
  | {
      kind: "feature";
      title: string;
      body: string;
      imageUrl?: string;
    }
  | {
      kind: "scenario";
      title: string;
      body: string;
    }
  | {
      kind: "cta";
      title: string;
      body: string;
    };

export interface GenerationPayload {
  options: GenerationOptions;
  sections: DetailSection[];
  createdAt: string;
}
