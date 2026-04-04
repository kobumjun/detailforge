import { pickCategoryStockUrl } from "@/lib/generation/category-stock";
import { buildCommerceImagePrompt } from "@/lib/generation/image-prompts";
import { inferVisualCategory } from "@/lib/generation/visual-category";
import { getImageGenProvider } from "@/lib/providers/image-gen";
import { getTextGenProvider } from "@/lib/providers/text-gen";
import type { ImageSlotRole } from "@/lib/providers/image-gen/types";
import type {
  DetailSection,
  GenerationOptions,
  GenerationPayload,
} from "./types";

const FEATURE_ROLES: ImageSlotRole[] = [
  "texture_detail",
  "usage_context",
  "feature_support",
];

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
  });

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

  const sections: DetailSection[] = [
    {
      kind: "hero",
      headline: copy.headline,
      subcopy: copy.subcopy,
      imageUrl: heroImg,
    },
  ];

  for (let i = 0; i < copy.benefits.length; i++) {
    const b = copy.benefits[i];
    let img = nextUserUrl();
    if (!img && options.aiFillImages) {
      const slotRole = FEATURE_ROLES[i % FEATURE_ROLES.length]!;
      img = await generateProductImage(image, {
        slotRole,
        aspect: "portrait",
        options,
        category,
        sectionTitle: b.title,
        sectionBody: b.body,
      });
    }
    sections.push({
      kind: "feature",
      title: b.title,
      body: b.body,
      imageUrl: img,
    });
  }

  sections.push(
    {
      kind: "scenario",
      title: copy.scenarioTitle,
      body: copy.scenarioBody,
    },
    {
      kind: "cta",
      title: copy.ctaTitle,
      body: copy.ctaBody,
    },
  );

  return {
    options,
    sections,
    createdAt: new Date().toISOString(),
  };
}
