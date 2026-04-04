import type { VisualCategoryKey } from "./visual-category";

/**
 * Curated Unsplash stills aligned per vertical (commercial-style, not random scenery).
 * License: Unsplash — https://unsplash.com/license
 */
const STOCK: Record<VisualCategoryKey, string[]> = {
  food: [
    "https://images.unsplash.com/photo-1587393855524-087f83d95bc2?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1543163521-1bf539f55f2c?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=960&q=82",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1556228578-0d385b627af2?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=960&q=82",
  ],
  fashion: [
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=960&q=82",
  ],
  pet: [
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1583337130417-334622a6dedb?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1530281700549-e82e7bf090d6?auto=format&fit=crop&w=960&q=82",
  ],
  tech: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1588508065123-2b89e2eaa8fb?auto=format&fit=crop&w=960&q=82",
  ],
  home: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=960&q=82",
  ],
  kids: [
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=960&q=82",
  ],
  general: [
    "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=960&q=82",
    "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=960&q=82",
  ],
};

function stableHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickCategoryStockUrl(
  categoryKey: VisualCategoryKey,
  seed: string,
): string {
  const list = STOCK[categoryKey] ?? STOCK.general;
  const idx = stableHash(seed) % list.length;
  return list[idx]!;
}
