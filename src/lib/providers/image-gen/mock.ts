import { pickCategoryStockUrl } from "@/lib/generation/category-stock";
import type { VisualCategoryKey } from "@/lib/generation/visual-category";
import type { ImageGenInput, ImageGenProvider } from "./types";

/**
 * Category-aligned stock stills — deterministic per prompt/slot (no random scenery).
 */
export class MockImageGenProvider implements ImageGenProvider {
  async generate(input: ImageGenInput): Promise<string> {
    const key: VisualCategoryKey = input.categoryKey ?? "general";
    const seed = `${input.prompt}|${input.slotRole ?? "slot"}|${input.aspect ?? "sq"}`;
    return pickCategoryStockUrl(key, seed);
  }
}
