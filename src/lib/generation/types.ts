import type { DetailLength, ToneOption } from "@/lib/providers/text-gen/types";
import type { VisualCategoryKey } from "@/lib/generation/visual-category";

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
  userImageUrls: string[];
}

/** v1 legacy sections (DB에 과거 데이터) */
export type LegacyDetailSection =
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

export type CommerceBlock =
  | {
      type: "hero_shelf";
      badges: string[];
      headline: string;
      subcopy: string;
      imageUrl?: string;
    }
  | {
      type: "trust_strip";
      items: { title: string; sub?: string }[];
    }
  | {
      type: "pain_panel";
      eyebrow: string;
      title: string;
      body: string;
      tag?: string;
    }
  | {
      type: "feature_grid";
      columns: 2 | 3;
      items: { n?: string; title: string; body: string }[];
    }
  | {
      type: "fullbleed_visual";
      label?: string;
      imageUrl?: string;
    }
  | {
      type: "stats_band";
      stats: { value: string; label: string }[];
    }
  | {
      type: "checklist_icons";
      title: string;
      items: string[];
    }
  | {
      type: "compare_table";
      title: string;
      rows: { label: string; ours: string; typical: string }[];
    }
  | {
      type: "quote_review";
      quote: string;
      author: string;
    }
  | {
      type: "scenario_split";
      eyebrow: string;
      title: string;
      body: string;
      aside?: string;
    }
  | {
      type: "recommend_banner";
      title: string;
      body: string;
    }
  | {
      type: "composition_cards";
      title: string;
      items: string[];
    }
  | {
      type: "notice_box";
      title: string;
      lines: string[];
    }
  | {
      type: "cta_band";
      title: string;
      body: string;
      buttonLabel: string;
    };

export interface GenerationPayloadV2 {
  version: 2;
  options: GenerationOptions;
  categoryKey: VisualCategoryKey;
  blocks: CommerceBlock[];
  createdAt: string;
}

/** v1 */
export interface GenerationPayloadV1 {
  options: GenerationOptions;
  sections: LegacyDetailSection[];
  createdAt: string;
}

export type GenerationPayload = GenerationPayloadV1 | GenerationPayloadV2;

export function isPayloadV2(p: GenerationPayload): p is GenerationPayloadV2 {
  return (p as GenerationPayloadV2).version === 2;
}
