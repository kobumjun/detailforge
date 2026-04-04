import { getImageGenProvider } from "@/lib/providers/image-gen";
import { getTextGenProvider } from "@/lib/providers/text-gen";
import type {
  DetailSection,
  GenerationOptions,
  GenerationPayload,
} from "./types";

export async function buildGenerationPayload(
  options: GenerationOptions,
): Promise<GenerationPayload> {
  const text = getTextGenProvider();
  const image = getImageGenProvider();

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
    heroImg = await image.generate({
      prompt: `${options.productDescription} hero shot, premium catalog style`,
      aspect: "landscape",
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

  for (const b of copy.benefits) {
    let img = nextUserUrl();
    if (!img && options.aiFillImages) {
      img = await image.generate({
        prompt: `${options.productDescription}. ${b.title}. ${b.body.slice(0, 160)}`,
        aspect: "portrait",
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
