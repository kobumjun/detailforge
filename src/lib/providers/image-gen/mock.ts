import type { ImageGenInput, ImageGenProvider } from "./types";

/** Deterministic placeholder image from product keywords (no external API). */
export class MockImageGenProvider implements ImageGenProvider {
  async generate(input: ImageGenInput): Promise<string> {
    const seed =
      Array.from(input.prompt).reduce((a, c) => a + c.charCodeAt(0), 0) %
      1000;
    const w = 800;
    const h = input.aspect === "portrait" ? 1000 : input.aspect === "landscape" ? 500 : 800;
    return `https://picsum.photos/seed/detailforge${seed}/${w}/${h}`;
  }
}
