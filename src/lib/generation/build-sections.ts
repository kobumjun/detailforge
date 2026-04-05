import { voiceFor } from "@/lib/generation/commerce-voice";
import { pickCategoryStockUrl } from "@/lib/generation/category-stock";
import { buildCommerceImagePrompt } from "@/lib/generation/image-prompts";
import { inferVisualCategory } from "@/lib/generation/visual-category";
import { getImageGenProvider } from "@/lib/providers/image-gen";
import { getTextGenProvider } from "@/lib/providers/text-gen";
import type { ImageSlotRole } from "@/lib/providers/image-gen/types";
import type {
  CommerceBlock,
  GenerationOptions,
  GenerationPayload,
  GenerationPayloadV2,
} from "./types";

async function generateProductImage(
  image: ReturnType<typeof getImageGenProvider>,
  args: {
    slotRole: ImageSlotRole;
    aspect: "square" | "landscape" | "portrait";
    options: GenerationOptions;
    category: ReturnType<typeof inferVisualCategory>;
    sectionTitle?: string;
    sectionBody?: string;
  },
): Promise<string> {
  const prompt = buildCommerceImagePrompt({
    slotRole: args.slotRole,
    productDescription: args.options.productDescription,
    targetCustomer: args.options.targetCustomer,
    sellingPoints: args.options.sellingPoints,
    category: args.category,
    sectionTitle: args.sectionTitle,
    sectionBody: args.sectionBody,
  });

  const input = {
    prompt,
    aspect: args.aspect,
    slotRole: args.slotRole,
    categoryKey: args.category.key,
  };

  try {
    return await image.generate(input);
  } catch {
    return pickCategoryStockUrl(
      args.category.key,
      `${prompt}|${args.slotRole}|fallback`,
    );
  }
}

export async function buildGenerationPayload(
  options: GenerationOptions,
): Promise<GenerationPayload> {
  const text = getTextGenProvider();
  const image = getImageGenProvider();

  const category = inferVisualCategory({
    productDescription: options.productDescription,
    targetCustomer: options.targetCustomer,
    sellingPoints: options.sellingPoints,
  });

  const copy = await text.generate({
    productDescription: options.productDescription,
    targetCustomer: options.targetCustomer,
    tone: options.tone,
    colorHint: options.colorHint,
    sellingPoints: options.sellingPoints,
    length: options.length,
    categoryKey: category.key,
  });

  const voice = voiceFor(category.key);

  const queue = [...options.userImageUrls];
  let userIdx = 0;
  const nextUserUrl = () => {
    if (userIdx >= queue.length) return undefined;
    const u = queue[userIdx];
    userIdx += 1;
    return u;
  };

  let heroImg = nextUserUrl();
  if (!heroImg && options.aiFillImages) {
    heroImg = await generateProductImage(image, {
      slotRole: "hero",
      aspect: "landscape",
      options,
      category,
    });
  }

  let fullbleedImg = nextUserUrl();
  if (!fullbleedImg && options.aiFillImages) {
    fullbleedImg = await generateProductImage(image, {
      slotRole: "lifestyle_scene",
      aspect: "landscape",
      options,
      category,
      sectionTitle: "상세 비주얼",
    });
  }

  let packageImg: string | undefined;
  if (options.length === "long" && options.aiFillImages) {
    packageImg = nextUserUrl();
    if (!packageImg) {
      packageImg = await generateProductImage(image, {
        slotRole: "package_shot",
        aspect: "square",
        options,
        category,
        sectionTitle: "구성 안내",
      });
    }
  }

  const blocks: CommerceBlock[] = [];

  blocks.push({
    type: "hero_shelf",
    badges: copy.badges,
    headline: copy.headline,
    subcopy: copy.subcopy,
    imageUrl: heroImg,
  });

  blocks.push({
    type: "trust_strip",
    items: voice.trustStrip.map((t) => ({ title: t.title, sub: t.sub })),
  });

  blocks.push({
    type: "pain_panel",
    eyebrow: voice.painEyebrow,
    title: voice.painTitle,
    body: copy.painBody,
    tag: "POINT",
  });

  const fCols =
    options.length === "long" && copy.benefits.length >= 3 ? 3 : 2;
  blocks.push({
    type: "feature_grid",
    columns: fCols,
    items: copy.benefits.map((b, i) => ({
      n: String(i + 1),
      title: b.title,
      body: b.body,
    })),
  });

  blocks.push({
    type: "fullbleed_visual",
    label: "상세 이미지",
    imageUrl: fullbleedImg,
  });

  if (options.length !== "short") {
    blocks.push({ type: "stats_band", stats: copy.stats });
  }

  blocks.push({
    type: "checklist_icons",
    title: "구성 & 체크리스트",
    items: copy.checklist,
  });

  if (options.length !== "short") {
    blocks.push({
      type: "compare_table",
      title: "비교 한눈에",
      rows: copy.comparison.map((r) => ({
        label: r.label,
        ours: r.ours,
        typical: r.typical,
      })),
    });
  }

  blocks.push({
    type: "scenario_split",
    eyebrow: "활용 가이드",
    title: copy.scenarioTitle,
    body: copy.scenarioBody,
    aside: copy.scenarioAside,
  });

  blocks.push({
    type: "recommend_banner",
    title: voice.recommendTitle,
    body: copy.recommendBody,
  });

  if (options.length !== "short") {
    blocks.push({
      type: "quote_review",
      quote: copy.quoteText,
      author: copy.quoteFrom,
    });
  }

  const compItems = packageImg
    ? [...copy.compositionItems, "패키지 구성 참고 이미지 포함"]
    : [...copy.compositionItems];

  blocks.push({
    type: "composition_cards",
    title: "구성 안내",
    items: compItems,
  });

  if (options.length === "long" && packageImg) {
    blocks.push({
      type: "fullbleed_visual",
      label: "패키지 & 구성",
      imageUrl: packageImg,
    });
  }

  blocks.push({
    type: "notice_box",
    title: voice.noticeTitle,
    lines: copy.noticeLines,
  });

  blocks.push({
    type: "cta_band",
    title: copy.ctaTitle,
    body: copy.ctaBody,
    buttonLabel: "바로 구매하기",
  });

  const v2: GenerationPayloadV2 = {
    version: 2,
    options,
    categoryKey: category.key,
    blocks,
    createdAt: new Date().toISOString(),
  };

  return v2;
}
